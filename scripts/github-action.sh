#!/usr/bin/env bash
set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
node "$script_directory/github-action-inputs.mjs"
working_directory="${INPUT_WORKING_DIRECTORY:-.}"
cd "$working_directory"

# Generated config and inline private keys never live in the checked-out project.
action_temp="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/wotci-action.XXXXXX")"
trap 'rm -rf -- "$action_temp"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
export INPUT_PLATFORM="${INPUT_PLATFORM:-${WOTCI_PLATFORM:-}}"
generated_config="$(node "$script_directory/github-action-config.mjs" "$action_temp")"

# Fail before any upload if the requested evidence file cannot be created.
if [ -n "${INPUT_JSON_OUTPUT:-}" ]; then
  mkdir -p -- "$(dirname -- "$INPUT_JSON_OUTPUT")"
  : > "$INPUT_JSON_OUTPUT"
fi

args=("${INPUT_COMMAND:-upload}")

if [ -n "${INPUT_PLATFORM:-}" ]; then
  args+=("-p" "$INPUT_PLATFORM")
fi

if [ -n "${INPUT_CONFIG:-}" ]; then
  args+=("-c" "$INPUT_CONFIG")
elif [ -n "$generated_config" ]; then
  args+=("-c" "$generated_config")
fi

if [ -n "${INPUT_JSON_OUTPUT:-}" ]; then
  args+=("--json")
fi

case "${INPUT_DRY_RUN:-false}" in
  true|1) args+=("--dry-run") ;;
esac

if [ -n "${INPUT_QRCODE_OUTPUT:-}" ]; then
  args+=("--qr-output" "$INPUT_QRCODE_OUTPUT")
fi

case "${INPUT_COMMAND:-upload}" in
  upload|preview)
    if [ -n "${INPUT_SUMMARY:-}" ]; then
      args+=("--summary" "$INPUT_SUMMARY")
    fi
    ;;
esac

# Action versions are independent from the npm CLI version.
resolve_package_version() {
  node "$script_directory/github-action-version.mjs"
}

if [ -x "./node_modules/.bin/wotci" ]; then
  cli=("./node_modules/.bin/wotci")
  echo '[wotci-action] 使用项目本地 CLI，跳过临时安装' >&2
else
  package="@wot-ui/ci@$(resolve_package_version)"
  registry="${npm_config_registry:-${NPM_CONFIG_REGISTRY:-https://registry.npmjs.org/}}"
  npm_cache="${WOTCI_NPM_CACHE:-$action_temp/npm-cache}"
  npx_options=(--yes --registry "$registry" --cache "$npm_cache")
  prepare_started=$SECONDS
  echo "[wotci-action] 准备 CLI：$package" >&2
  # Warm the same npx package cache without loading the CLI or calling an SDK.
  # Explicit registry avoids inheriting a slow project-level registry mirror.
  prepare_status=0
  npx "${npx_options[@]}" --package "$package" -- node -e '' >&2 || prepare_status=$?
  echo "[wotci-action] CLI 准备耗时：$((SECONDS - prepare_started))s（退出码 ${prepare_status}）" >&2
  if [ "$prepare_status" -ne 0 ]; then
    exit "$prepare_status"
  fi
  if [ -n "${GITHUB_OUTPUT:-}" ] && [ -n "${WOTCI_NPM_CACHE:-}" ]; then
    printf 'cli-cache-ready=true\n' >> "$GITHUB_OUTPUT"
  fi
  cli=("npx" "${npx_options[@]}" "$package")
fi

# Do not log registry URLs, which may carry authentication information.
echo "[wotci-action] 运行 CLI：${args[*]}" >&2
run_started=$SECONDS
run_status=0
if [ -n "${INPUT_JSON_OUTPUT:-}" ]; then
  # Keep wrapper/SDK diagnostics out of the JSON file. pipefail preserves the
  # CLI's non-zero exit even when tee writes its structured failure result.
  "${cli[@]}" "${args[@]}" | tee -- "$INPUT_JSON_OUTPUT" || run_status=$?
else
  "${cli[@]}" "${args[@]}" || run_status=$?
fi
echo "[wotci-action] CLI 执行耗时：$((SECONDS - run_started))s（退出码 ${run_status}）" >&2
exit "$run_status"
