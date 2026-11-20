#!/bin/bash
# My Study Journal — installer per macOS.
# Crea l'app "My Study Journal" in ~/Applications con la sua icona
# e apre il Finder su quella cartella, così la trascini nel Dock.
# L'app apre il quaderno in una finestra di Brave senza barre (modalità app).
set -e

APP_NAME="My Study Journal"
URL="https://roccone.github.io/my-study-journal/"
APP_DIR="$HOME/Applications/$APP_NAME.app"
TMP="$(mktemp -d)"

echo "✿ Installo $APP_NAME…"

if [ ! -d "/Applications/Brave Browser.app" ]; then
  echo "⚠️  Non trovo Brave in /Applications: l'app si aprirà nel browser predefinito."
fi

mkdir -p "$HOME/Applications"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"

# 1. Il programma che apre la finestra
cat > "$APP_DIR/Contents/MacOS/launch" <<EOF
#!/bin/bash
URL="$URL"
if [ -d "/Applications/Brave Browser.app" ]; then
  open -na "Brave Browser" --args --app="\$URL" --window-size=1320,900 --window-position=80,40
else
  open "\$URL"
fi
EOF
chmod +x "$APP_DIR/Contents/MacOS/launch"

# 2. La carta d'identità dell'app
cat > "$APP_DIR/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>io.github.roccone.my-study-journal</string>
  <key>CFBundleExecutable</key><string>launch</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>LSUIElement</key><true/>
</dict></plist>
EOF

# 3. L'icona (scaricata dal sito e convertita nel formato .icns del Mac)
curl -fsSL "${URL}icon-1024.png" -o "$TMP/icon.png"
mkdir -p "$TMP/AppIcon.iconset"
for s in 16 32 128 256 512; do
  sips -z $s $s "$TMP/icon.png" --out "$TMP/AppIcon.iconset/icon_${s}x${s}.png" >/dev/null
  d=$((s*2))
  sips -z $d $d "$TMP/icon.png" --out "$TMP/AppIcon.iconset/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$TMP/AppIcon.iconset" -o "$APP_DIR/Contents/Resources/AppIcon.icns"
touch "$APP_DIR"

# 4. Tolgo il vecchio collegamento sulla Scrivania (il Dock non lo accetta)
[ -L "$HOME/Desktop/$APP_NAME" ] && rm "$HOME/Desktop/$APP_NAME"

rm -rf "$TMP"
echo "✓ Fatto! Si apre il Finder con \"$APP_NAME\" selezionata:"
echo "  trascinala nel Dock e cliccala per aprire il quaderno."
open -R "$APP_DIR"
open "$APP_DIR"
