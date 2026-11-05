#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit): keep an edited file in the shape CI expects.
#   *.ts / *.tsx / *.js / *.mjs                      `eslint --fix`; what it cannot fix goes back to Claude (exit 2)
#   docs/architecture/mermaid/*.mmd, ARCHITECTURE.md  test/unit/docs/diagrams.test.ts (fence = source)
set -uo pipefail

f=$(jq -r '.tool_input.file_path // empty')
[ -n "$f" ] || exit 0
root="${CLAUDE_PROJECT_DIR:-$PWD}"
case "$f" in "$root"/*) ;; *) exit 0 ;; esac
rel=${f#"$root"/}
[ -f "$f" ] || exit 0

case "$rel" in
  node_modules/* | dist/* | coverage/*) exit 0 ;;
  docs/architecture/mermaid/*.mmd | ARCHITECTURE.md)
    if ! out=$(cd "$root" && npx vitest run test/unit/docs/diagrams.test.ts 2>&1); then
      echo "ARCHITECTURE.md and docs/architecture/mermaid/ differ after editing $rel; update the other side:" >&2
      echo "$out" | grep -E 'embeds|is not embedded|Expected|Received|^\s+[-+] ' >&2
      exit 2
    fi
    exit 0 ;;
  *.ts | *.tsx | *.js | *.mjs)
    if ! out=$(cd "$root" && npx eslint --fix --no-warn-ignored "$rel" 2>&1); then
      echo "ESLint problems left in $rel after --fix:" >&2
      echo "$out" >&2
      exit 2
    fi
    exit 0 ;;
esac
exit 0
