#!/bin/sh
# Applies the newest esthemax-update.zip exported by cms.html (Publish Changes),
# then commits and pushes it so the changes go live.
# Usage: tools/apply-cms-update.sh [path/to/esthemax-update.zip]
set -e
cd "$(dirname "$0")/.."
ZIP="${1:-$(ls -t "$HOME"/Downloads/esthemax-update*.zip 2>/dev/null | head -1)}"
[ -f "$ZIP" ] || { echo "No esthemax-update.zip found in Downloads."; exit 1; }
echo "Applying $ZIP"
unzip -o "$ZIP" 'assets/data/*' 'assets/uploads/*' -d . 2>/dev/null || unzip -o "$ZIP" -d .
git add assets/data assets/uploads
git commit -m "Content update from the CMS" || { echo "Nothing changed."; exit 0; }
git push origin main
echo "Done. The update is live on GitHub."
