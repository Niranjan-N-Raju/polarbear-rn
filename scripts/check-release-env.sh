#!/bin/sh
# Fails an iOS Release build when the env file react-native-config will compile in contains
# test credentials or a non-HTTPS API base URL. Prints key names only, never values.
set -eu

PROJECT_ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"

if [ -s /tmp/envfile ]; then
  ENV_NAME="$(tr -d '[:space:]' < /tmp/envfile)"
elif [ -n "${ENVFILE:-}" ]; then
  ENV_NAME="$ENVFILE"
else
  ENV_NAME=".env"
fi

case "$ENV_NAME" in
  /*) ENV_PATH="$ENV_NAME" ;;
  *) ENV_PATH="$PROJECT_ROOT/$ENV_NAME" ;;
esac

if [ ! -f "$ENV_PATH" ]; then
  echo "error: Release env file '$ENV_NAME' was not found. Build with ENVFILE=.env.production." >&2
  exit 1
fi

value_of() {
  sed -n "s/^[[:space:]]*\(export[[:space:]]\{1,\}\)\{0,1\}$1[[:space:]]*=[[:space:]]*//p" "$ENV_PATH" \
    | tail -n 1 | sed -e 's/[[:space:]]*$//' -e 's/^["'\'']//' -e 's/["'\'']$//'
}

status=0
for key in $(sed -n 's/^[[:space:]]*\(export[[:space:]]\{1,\}\)\{0,1\}\(TEST_[A-Za-z0-9_]*\)[[:space:]]*=.*/\2/p' "$ENV_PATH" | sort -u); do
  if [ -n "$(value_of "$key")" ]; then
    echo "error: $key must be empty in '$ENV_NAME' for Release builds." >&2
    status=1
  fi
done

case "$(value_of API_BASE_URL)" in
  https://?*) ;;
  *)
    echo "error: API_BASE_URL in '$ENV_NAME' must be an https:// URL for Release builds." >&2
    status=1
    ;;
esac

exit "$status"
