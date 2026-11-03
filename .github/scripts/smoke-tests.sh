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
# The SDK's loadRemote reads the container from the global the entry defines (var app2).
if ! head -c 20 /tmp/mfe-dashboard-entry.js | grep -q '^var app2'; then
  echo "::error file=rsbuild.config.ts,title=Startup gate::remoteEntry.js does not define the var container global app2"
  exit 1
fi
if [ "${map_count}" -ne 0 ]; then
  echo "::error file=Dockerfile,title=Startup gate::${map_count} source maps were shipped in the image"
  exit 1
fi
echo "::endgroup::"

{
  echo "### Smoke test results"
  echo "- ✅ Startup gate: \`/healthz\`, \`/\`, and \`/remoteEntry.js\` returned 200"
  echo "- 📦 Image size (linux/amd64): **${mb} MB** (limit: ${MAX_MB} MB)"
  echo "- 🔍 [Security (Trivy SARIF results)](https://github.com/${GITHUB_REPOSITORY}/security/code-scanning)"
} >> "$GITHUB_STEP_SUMMARY"
