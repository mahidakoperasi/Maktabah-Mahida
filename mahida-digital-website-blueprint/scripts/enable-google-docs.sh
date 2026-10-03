#!/usr/bin/env bash
# Configure the already deployed 6393627 image; never builds or migrates it.
set -euo pipefail
umask 077
DOC_URL="${1:?Masukkan tautan Google Docs dokumen uji yang sudah dibagikan.}"
EXPECTED=6393627cfa72eca469354fadf5532ace91dcb27e
IMAGE=mahida:maktabah-6393627
ENV_FILE=/opt/Maktabah-Mahida/mahida-digital-website-blueprint/.env.production
KEY_FILE=/opt/mahida-secrets/mahida-google-docs.json
NETWORK=mahida-network
STAMP="$(date +%Y%m%d%H%M%S)-$$"
BACKUP_DIR="/root/mahida-backups/google-docs-$STAMP"
PREVIEW="mahida-docs-preview-$STAMP"
OLD="mahida-app-before-google-docs-$STAMP"
preview_created=0
swapped=0
configured=0
env_changed=0
env_temp=''
cleanup() {
  local code=$?
  trap - EXIT
  if (( preview_created )); then docker rm -f "$PREVIEW" >/dev/null 2>&1 || true; fi
  if (( !configured && env_changed )); then
    install -m 600 "$BACKUP_DIR/env-before-google-docs" "$ENV_FILE" || echo 'Pemulihan env gagal; periksa backup.' >&2
  fi
  if (( swapped && !configured )); then
    docker rm -f mahida-app >/dev/null 2>&1 || true
    if docker rename "$OLD" mahida-app && docker start mahida-app >/dev/null; then
      echo 'KONFIGURASI GAGAL; kontainer lama dipulihkan.' >&2
    else
      echo "ROLLBACK MANUAL DIPERLUKAN: $OLD" >&2
    fi
  fi
  if [ -n "$env_temp" ]; then rm -f "$env_temp"; fi
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
test "$(id -u)" -eq 0
exec 9>/var/lock/mahida-release.lock
flock -n 9 || { echo 'Rilis/konfigurasi lain masih berjalan.' >&2; exit 1; }
test -s "$ENV_FILE"
test -s "$KEY_FILE" || { echo 'File kunci JSON belum tersedia.' >&2; exit 1; }
test "$(docker inspect -f '{{.State.Status}} {{.State.Health.Status}}' mahida-app)" = 'running healthy'
test "$(docker inspect -f '{{.Config.Image}}' mahida-app)" = "$IMAGE" || { echo 'Image produksi berbeda dari Maktabah 6393627.' >&2; exit 1; }
test "$(docker inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' mahida-app)" = "$EXPECTED"
test "$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$IMAGE")" = "$EXPECTED"
while IFS= read -r destination; do
  if [ -n "$destination" ] && [ "$destination" != "$KEY_FILE" ]; then
    echo 'Produksi memiliki mount tambahan; konfigurasi dihentikan agar mount tetap terjaga.' >&2
    exit 1
  fi
done < <(docker inspect -f '{{range .Mounts}}{{println .Destination}}{{end}}' mahida-app)
docker network inspect "$NETWORK" >/dev/null
if [ -n "$(ss -H -ltn 'sport = :3001')" ]; then echo 'Port preview 3001 sedang digunakan.' >&2; exit 1; fi
# The image runs as UID 1001. Errors are redacted; keys and tokens never reach logs.
docker run --rm -i --network "$NETWORK" --mount "type=bind,src=$KEY_FILE,dst=$KEY_FILE,readonly" --entrypoint node "$IMAGE" - "$DOC_URL" <<'NODE'
const fs = require('node:fs');
const crypto = require('node:crypto');
(async () => {
  let c;
  try {
    c = JSON.parse(fs.readFileSync('/opt/mahida-secrets/mahida-google-docs.json', 'utf8'));
    if (c.type !== 'service_account' || typeof c.client_email !== 'string' || typeof c.private_key !== 'string') throw Error();
    const key = crypto.createPrivateKey(c.private_key);
    if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048) throw Error();
  } catch { throw Error('Kunci JSON tidak valid atau belum dapat dibaca UID 1001.'); }
  let id;
  try {
    const u = new URL(process.argv[2]);
    id = /^\/document\/d\/([\w-]{10,})(?:\/|$)/.exec(u.pathname)?.[1];
    if (u.protocol !== 'https:' || u.hostname !== 'docs.google.com' || u.username || u.password || !id) throw Error();
  } catch { throw Error('Gunakan tautan https://docs.google.com/document/d/ID/edit.'); }
  const now = Math.floor(Date.now()/1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:c.client_email,scope:'https://www.googleapis.com/auth/documents.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
  const assertion = unsigned+'.'+crypto.sign('RSA-SHA256',Buffer.from(unsigned),c.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('Otorisasi Google gagal (HTTP '+response.status+'). Periksa kunci, status service account, dan waktu VPS.');
  const token = await response.json();
  if (typeof token.access_token !== 'string') throw Error('Google tidak mengembalikan token yang valid.');
  const doc = await fetch('https://docs.googleapis.com/v1/documents/'+id+'?includeTabsContent=true',{headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(20000)});
  if (!doc.ok) throw Error('Dokumen tidak dapat dibaca (HTTP '+doc.status+'). Periksa aktivasi Google Docs API dan akses Viewer service account.');
  console.log('Kunci, otorisasi Google, dan akses dokumen uji berhasil.');
})().catch(error => {
  console.error(error instanceof Error && !['TypeError','TimeoutError','AbortError'].includes(error.name) ? error.message : 'Koneksi Google gagal atau kehabisan waktu.');
  process.exitCode = 1;
});
NODE
mkdir -p "$BACKUP_DIR"
install -m 600 "$ENV_FILE" "$BACKUP_DIR/env-before-google-docs"
env_temp="$(mktemp "${ENV_FILE}.docs.XXXXXX")"
awk '!/^[[:space:]]*GOOGLE_DOCS_CREDENTIALS_FILE=/' "$ENV_FILE" > "$env_temp"
printf '\nGOOGLE_DOCS_CREDENTIALS_FILE=%s\n' "$KEY_FILE" >> "$env_temp"
chmod 600 "$env_temp"
chown --reference="$ENV_FILE" "$env_temp"
mv "$env_temp" "$ENV_FILE"
env_temp=''
env_changed=1
health_ok() {
  local response
  response="$(curl -fsS --max-time 8 "$1/api/health" 2>/dev/null)" || return 1
  [[ "$response" == *'"ok":true'* && "$response" == *'"database":"connected"'* && "$response" == *'"maktabahReady":true'* && "$response" == *'"qualityReady":true'* ]]
}
wait_ready() {
  local attempt
  for (( attempt=0; attempt<45; attempt++ )); do
    if [ "$(docker inspect -f '{{.State.Health.Status}}' "$1")" = healthy ] && health_ok "$2" && curl -fsS --max-time 15 "$2/maktabah" >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  return 1
}
docker run -d --name "$PREVIEW" --network "$NETWORK" --env-file "$ENV_FILE" --mount "type=bind,src=$KEY_FILE,dst=$KEY_FILE,readonly" -p 127.0.0.1:3001:3000 "$IMAGE" >/dev/null
preview_created=1
wait_ready "$PREVIEW" http://127.0.0.1:3001 || { echo 'Preview gagal; produksi belum ditukar.' >&2; exit 1; }
docker rm -f "$PREVIEW" >/dev/null
preview_created=0
printf '%s\n' "$OLD" > "$BACKUP_DIR/rollback-container.txt"
docker stop mahida-app >/dev/null
if ! docker rename mahida-app "$OLD"; then docker start mahida-app >/dev/null; exit 1; fi
swapped=1
docker run -d --name mahida-app --network "$NETWORK" --env-file "$ENV_FILE" --mount "type=bind,src=$KEY_FILE,dst=$KEY_FILE,readonly" --restart unless-stopped -p 127.0.0.1:3000:3000 "$IMAGE" >/dev/null
wait_ready mahida-app http://127.0.0.1:3000 && health_ok https://mahida.my.id || { echo 'Validasi produksi gagal; rollback dijalankan.' >&2; exit 1; }
# Check effective credentials as the real application user without displaying secrets.
docker exec mahida-app node -e 'const fs=require("node:fs");const p=process.env.GOOGLE_DOCS_CREDENTIALS_FILE;if(p!=="/opt/mahida-secrets/mahida-google-docs.json")process.exit(1);fs.accessSync(p,fs.constants.R_OK);console.log("File identitas terbaca oleh aplikasi.")'
configured=1
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
echo "GOOGLE DOCS AKTIF; backup env: $BACKUP_DIR/env-before-google-docs; rollback: $OLD"
