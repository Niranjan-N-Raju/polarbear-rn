#!/usr/bin/env bash
# Generates iOS and Android launcher icons from a square SVG (rendered per-size with headless Chrome
# for crisp edges) or PNG (resized with `sips`).
# Usage: scripts/generate-app-icons.sh [source.svg|source.png]   (defaults to public/app-icon.svg)
# Env: IOS_ICON_BG  background used for iOS icons, which must be opaque (default #ffd44f)
set -euo pipefail

cd "$(dirname "$0")/.."
SRC="${1:-public/app-icon.svg}"
IOS_BG="${IOS_ICON_BG:-#ffd44f}"
IOS_DIR="ios/reactnative/Images.xcassets/AppIcon.appiconset"
ANDROID_RES="android/app/src/main/res"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

[[ -f "$SRC" ]] || { echo "Source not found: $SRC" >&2; exit 1; }
SRC_ABS="$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")"

if [[ "$SRC" == *.svg ]]; then
  [[ -x "$CHROME" ]] || { echo "Google Chrome is required to render SVG icons (set CHROME=/path/to/chrome)" >&2; exit 1; }
fi

# render <size> <background> <out>; background "transparent" keeps alpha, a colour flattens it.
render() {
  local size="$1" bg="$2" out="$3"
  if [[ "$SRC" == *.svg ]]; then
    local html="$TMP/icon-$size-${bg//[^a-z0-9]/}.html"
    cat > "$html" <<HTML
<!doctype html><html><head><style>
html,body{margin:0;padding:0;background:$bg;overflow:hidden}
img{display:block;width:${size}px;height:${size}px}
</style></head><body><img src="file://$SRC_ABS"></body></html>
HTML
    local flags=()
    [[ "$bg" == transparent ]] && flags+=(--default-background-color=00000000)
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
      ${flags[@]+"${flags[@]}"} --window-size="$size,$size" --screenshot="$out" "file://$html" >/dev/null 2>&1
    [[ -f "$out" ]] || { echo "Failed to render $out" >&2; exit 1; }
  else
    sips -z "$size" "$size" "$SRC" --out "$out" >/dev/null
    if [[ "$bg" != transparent ]]; then
      # iOS icons must not contain an alpha channel; flatten via JPEG (PNG sources only).
      sips -s format jpeg -s formatOptions 100 "$out" --out "$TMP/flat.jpg" >/dev/null
      sips -s format png "$TMP/flat.jpg" --out "$out" >/dev/null
    fi
  fi
}

ios_icon() { render "$2" "$IOS_BG" "$IOS_DIR/$1"; }
ios_icon icon-20@2x.png 40
ios_icon icon-20@3x.png 60
ios_icon icon-29@2x.png 58
ios_icon icon-29@3x.png 87
ios_icon icon-40@2x.png 80
ios_icon icon-40@3x.png 120
ios_icon icon-60@2x.png 120
ios_icon icon-60@3x.png 180
ios_icon icon-1024.png 1024

android_icon() {
  render "$2" transparent "$ANDROID_RES/mipmap-$1/ic_launcher.png"
  cp "$ANDROID_RES/mipmap-$1/ic_launcher.png" "$ANDROID_RES/mipmap-$1/ic_launcher_round.png"
}
android_icon mdpi 48
android_icon hdpi 72
android_icon xhdpi 96
android_icon xxhdpi 144
android_icon xxxhdpi 192

echo "App icons generated from $SRC"
