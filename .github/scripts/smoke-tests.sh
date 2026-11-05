#!/usr/bin/env bash
# Image size + HTTP startup gate for the CI-built mfe-dashboard image.
set -euo pipefail

IMAGE="${IMAGE:-mfe-dashboard-ci-test}"
MAX_MB="${MAX_MB:-200}"
PORT="${PORT:-18080}"
CID=""

cleanup() {
  if [ -n "${CID}" ]; then
    docker rm -f "${CID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "::group::Image size check (linux/amd64)"
size=$(docker image inspect "${IMAGE}" --format='{{.Size}}')
mb=$((size / 1024 / 1024))
echo "Image size: ${mb} MB (limit: ${MAX_MB} MB)"
if [ "${mb}" -gt "${MAX_MB}" ]; then
  echo "::error file=Dockerfile,title=Image size::Image is ${mb} MB, exceeds ${MAX_MB} MB limit — check COPY instructions for accidental inclusions (node_modules, .git)"
  exit 1
fi
echo "::endgroup::"

echo "::group::Startup gate"
CID=$(docker run -d --rm -p "127.0.0.1:${PORT}:8080" "${IMAGE}")
ready=0
for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/healthz" | grep -q 'ok'; then
    ready=1
    break
  fi
  sleep 1
done
if [ "${ready}" -ne 1 ]; then
  echo "::error file=nginx/default.conf,title=Startup gate::Container did not serve /healthz within 30s"
  docker logs "${CID}" || true
  exit 1
fi

index_code=$(curl -s -o /tmp/mfe-dashboard-index.html -w '%{http_code}' "http://127.0.0.1:${PORT}/")
remote_code=$(curl -s -o /tmp/mfe-dashboard-entry.js -w '%{http_code}' "http://127.0.0.1:${PORT}/remoteEntry.js")
map_count=$(docker exec "${CID}" sh -c 'find /usr/share/nginx/html -name "*.map" | wc -l')
echo "GET / -> ${index_code}"
echo "GET /remoteEntry.js -> ${remote_code}"
echo "Source maps in image: ${map_count}"

if [ "${index_code}" != "200" ] || ! grep -q 'id="app"' /tmp/mfe-dashboard-index.html; then
  echo "::error file=index.html,title=Startup gate::Shell document was not served"
  exit 1
fi
if [ "${remote_code}" != "200" ]; then
  echo "::error file=rsbuild.config.ts,title=Startup gate::remoteEntry.js was not served (${remote_code})"
  exit 1
fi
# The SDK's loadRemote (1.0.0-alpha.4+) reads the container from __platform_mfe_<name>, which the
# preset's containerName gives the entry; an entry built with an older preset defines bare `app2`.
if ! head -c 40 /tmp/mfe-dashboard-entry.js | grep -q '^var __platform_mfe_app2;'; then
  echo "::error file=rsbuild.config.ts,title=Startup gate::remoteEntry.js does not define the container global __platform_mfe_app2 (rebuild with webpack-preset 1.0.0-alpha.4 or later)"
  exit 1
fi
if [ "${map_count}" -ne 0 ]; then
  echo "::error file=Dockerfile,title=Startup gate::${map_count} source maps were shipped in the image"
  exit 1
fi
echo "::endgroup::"

echo "::group::Nested route"
# A reload of a nested standalone route must still load the page's scripts (root-absolute /assets/…),
# not get index.html back for them.
nested_js=$(curl -sf "http://127.0.0.1:${PORT}/dashboard/user-management" | grep -o 'src="[^"]*\.js"' | head -1 | cut -d'"' -f2)
echo "first script: ${nested_js}"
case "${nested_js}" in
  /*) ;;
  *) echo "::error file=rsbuild.config.ts,title=Nested route::the standalone page links '${nested_js}', which a nested route resolves under its own path (set the standalone assetPrefix to /)"; exit 1 ;;
esac
nested_type=$(curl -s -o /dev/null -w '%{content_type}' "http://127.0.0.1:${PORT}${nested_js}")
if [[ "${nested_type}" != application/javascript* ]]; then
  echo "::error file=nginx/default.conf,title=Nested route::${nested_js} is served as '${nested_type}', not JavaScript"
  exit 1
fi
echo "::endgroup::"

echo "::group::Runtime config"
# The standalone page loads /config/runtime.json (src/standalone.ts); it must be JSON, not the SPA fallback.
config_type=$(curl -s -o /dev/null -w '%{content_type}' "http://127.0.0.1:${PORT}/config/runtime.json")
echo "content-type: ${config_type}"
if ! curl -sf "http://127.0.0.1:${PORT}/config/runtime.json" | grep -q '"auth"' || [[ "${config_type}" != application/json* ]]; then
  echo "::error file=nginx/default.conf,title=Runtime config::/config/runtime.json is missing or not served as JSON"
  exit 1
fi
echo "::endgroup::"

echo "::group::Remote manifest entry"
# web-shell's manifest pins remoteEntry.js by this integrity; it must match the file the image serves.
manifest_integrity=$(curl -sf "http://127.0.0.1:${PORT}/remote-manifest-entry.json" | sed -n 's/.*"integrity": *"\(sha384-[^"]*\)".*/\1/p')
served_integrity="sha384-$(openssl dgst -sha384 -binary /tmp/mfe-dashboard-entry.js | openssl base64 -A)"
echo "manifest: ${manifest_integrity}"
echo "served:   ${served_integrity}"
if [ -z "${manifest_integrity}" ] || [ "${manifest_integrity}" != "${served_integrity}" ]; then
  echo "::error file=config/remote-manifest-entry.mjs,title=Remote manifest entry::remote-manifest-entry.json is missing or its integrity does not match the served remoteEntry.js"
  exit 1
fi
echo "::endgroup::"

echo "::group::Security headers and compression"
doc_headers=$(curl -s -D - -o /dev/null "http://127.0.0.1:${PORT}/dashboard")
entry_headers=$(curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' "http://127.0.0.1:${PORT}/remoteEntry.js")
echo "${doc_headers}"
for header in \
  "Content-Security-Policy: default-src 'self'" \
  "frame-ancestors 'none'" \
  "X-Content-Type-Options: nosniff" \
  "X-Frame-Options: DENY" \
  "Referrer-Policy: strict-origin-when-cross-origin" \
  "X-Robots-Tag: noindex"; do
  if ! grep -qiF "${header}" <<<"${doc_headers}"; then
    echo "::error file=nginx/document-headers.conf,title=Security headers::The document is missing '${header}'"
    exit 1
  fi
done
if grep -qi '^Server: nginx/' <<<"${doc_headers}"; then
  echo "::error file=nginx/default.conf,title=Security headers::nginx reveals its version (server_tokens)"
  exit 1
fi
for header in "X-Content-Type-Options: nosniff" "Access-Control-Allow-Origin: *" "Content-Encoding: gzip"; do
  if ! grep -qiF "${header}" <<<"${entry_headers}"; then
    echo "::error file=nginx/default.conf,title=Security headers::remoteEntry.js is missing '${header}'"
    exit 1
  fi
done
echo "::endgroup::"

{
  echo "### Smoke test results"
  echo "- ✅ Startup gate: \`/healthz\`, \`/\`, and \`/remoteEntry.js\` returned 200"
  echo "- 📦 Image size (linux/amd64): **${mb} MB** (limit: ${MAX_MB} MB)"
  echo "- 🔍 [Security (Trivy SARIF results)](https://github.com/${GITHUB_REPOSITORY:-BCBP-SOLUTIONS-FZC-LLC/mfe-dashboard}/security/code-scanning)"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
