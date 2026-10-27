#!/usr/bin/env bash
# Generates iOS and Android launcher icons from a single square SVG or PNG (macOS `qlmanage`/`sips`).
# Usage: scripts/generate-app-icons.sh [source.svg|source.png]   (defaults to public/app-icon.svg)
set -euo pipefail

cd "$(dirname "$0")/.."
SRC="${1:-public/app-icon.svg}"
IOS_DIR="ios/reactnative/Images.xcassets/AppIcon.appiconset"
ANDROID_RES="android/app/src/main/res"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [[ "$SRC" == *.svg ]]; then
  qlmanage -t -s 1024 -o "$TMP" "$SRC" >/dev/null 2>&1
  RASTER="$TMP/$(basename "$SRC").png"
  [[ -f "$RASTER" ]] || { echo "Failed to rasterize $SRC" >&2; exit 1; }
else
  RASTER="$SRC"
fi

# iOS icons must not contain an alpha channel; round-tripping through JPEG flattens it onto white.
sips -z 1024 1024 "$RASTER" --out "$TMP/big.png" >/dev/null
sips -s format jpeg "$TMP/big.png" --out "$TMP/flat.jpg" >/dev/null
sips -s format png "$TMP/flat.jpg" --out "$TMP/ios-1024.png" >/dev/null

ios_icon() { sips -z "$2" "$2" "$TMP/ios-1024.png" --out "$IOS_DIR/$1" >/dev/null; }
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
  sips -z "$2" "$2" "$TMP/big.png" --out "$ANDROID_RES/mipmap-$1/ic_launcher.png" >/dev/null
  cp "$ANDROID_RES/mipmap-$1/ic_launcher.png" "$ANDROID_RES/mipmap-$1/ic_launcher_round.png"
}
android_icon mdpi 48
android_icon hdpi 72
android_icon xhdpi 96
android_icon xxhdpi 144
android_icon xxxhdpi 192

echo "App icons generated from $SRC"
