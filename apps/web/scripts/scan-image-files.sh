#!/bin/sh
# Fails if the image files contain env files or real private keys.
# Used by CI on the output of assemble-image.sh: scan-image-files.sh <dir>
# Real PEM keys only: the marker followed by base64 key data on the next line
# (library code that merely mentions the marker does not match).
set -u
dir="${1:-/app}"
found=0
envs="$(find "$dir" \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' -o -name 'id_rsa*' -o -name 'id_ed25519*' -o -name 'id_ecdsa*' \) -not -path '*/node_modules/*' 2>/dev/null)"
if [ -n "$envs" ]; then echo "Secret-like files found:"; echo "$envs"; found=1; fi
keys="$(grep -rlIzP -- '-----BEGIN [A-Z ]*PRIVATE KEY-----\r?\n[A-Za-z0-9+/=]{40}' "$dir" 2>/dev/null)"
if [ -n "$keys" ]; then echo "Private keys found:"; echo "$keys"; found=1; fi
[ "$found" -eq 0 ] && echo "No env files or private keys in $dir."
exit "$found"
