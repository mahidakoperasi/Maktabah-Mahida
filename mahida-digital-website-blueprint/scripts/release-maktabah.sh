#!/usr/bin/env bash
# Deployment guide companion: execute on the Mahida VPS, not in this workspace.
set -euo pipefail
umask 077
EXPECTED="${1:?Masukkan SHA commit rilis lengkap (40 karakter).}"
[[ "$EXPECTED" =~ ^[a-f0-9]{40}$ ]] || { echo "SHA commit tidak valid." >&2; exit 1; }
SHORT="${EXPECTED:0:7}"
SOURCE="/opt/mahida-maktabah-$SHORT"
ENV_FILE=/opt/Maktabah-Mahida/mahida-digital-website-blueprint/.env.production
BACKUP_DIR=/root/mahida-backups
ARCHIVE="${2:-$BACKUP_DIR/maktabah-$SHORT/mahida-editorial-image.tar.gz}"
NETWORK=mahida-network
TAG="mahida:maktabah-$SHORT"
STAMP="$(date +%Y%m%d%H%M%S)-$$"
PREVIEW="mahida-maktabah-preview-$STAMP"
OLD="mahida-app-before-maktabah-$STAMP"
BACKUP="$BACKUP_DIR/maktabah-$STAMP.dump"
preview_created=0
swapped=0
released=0
cleanup() {
  code=$?
  trap - EXIT
  if (( preview_created )); then docker rm -f "$PREVIEW" >/dev/null 2>&1 || true; fi
  if (( swapped && !released )); then
    docker rm -f mahida-app >/dev/null 2>&1 || true
    if docker rename "$OLD" mahida-app && docker start mahida-app >/dev/null; then
      echo 'RILIS GAGAL; kontainer lama dipulihkan.' >&2
    else
      echo "ROLLBACK MANUAL DIPERLUKAN: $OLD" >&2
    fi
  fi
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
test "$(id -u)" -eq 0
mkdir -p "$BACKUP_DIR"
exec 9>/var/lock/mahida-release.lock
flock -n 9 || { echo 'Rilis lain masih berjalan.' >&2; exit 1; }
test -f "$ENV_FILE"
test -s "$ARCHIVE"
test "$(git -C "$SOURCE" rev-parse HEAD)" = "$EXPECTED" || { echo 'Source rilis tidak cocok. Buat worktree sesuai panduan.' >&2; exit 1; }
test -z "$(git -C "$SOURCE" status --porcelain --untracked-files=no)" || { echo 'Source rilis memiliki perubahan lokal; dihentikan.' >&2; exit 1; }
test "$(docker inspect -f '{{.State.Status}} {{.State.Health.Status}}' mahida-app)" = 'running healthy' || { echo 'Kontainer produksi belum sehat; dihentikan.' >&2; exit 1; }
current_revision="$(docker inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' mahida-app)"
if [ "$current_revision" = "$EXPECTED" ]; then
  echo "Versi Maktabah $SHORT sudah aktif dan sehat; rilis tidak diulang."
  released=1
  exit 0
fi
test "$current_revision" = 6393627cfa72eca469354fadf5532ace91dcb27e || { echo 'Versi produksi berbeda dari dasar Maktabah 6393627; rilis dihentikan.' >&2; exit 1; }
docker network inspect "$NETWORK" >/dev/null
docker_root="$(docker info -f '{{.DockerRootDir}}')"
available_mb="$(df -Pm "$docker_root" | awk 'NR==2 { print $4 }')"
[[ "$available_mb" =~ ^[0-9]+$ ]] && (( available_mb >= 2048 )) || { echo 'Ruang Docker kurang dari 2 GB; produksi belum diubah.' >&2; exit 1; }
if [ -n "$(ss -H -ltn 'sport = :3001')" ]; then echo 'Port preview 3001 sedang digunakan; dihentikan tanpa menghapus kontainer lain.' >&2; exit 1; fi
secret_mount=()
credential_file="$(sed -n 's/^GOOGLE_DOCS_CREDENTIALS_FILE=//p' "$ENV_FILE" | tail -n 1 | tr -d '\r')"
if [ -n "$credential_file" ]; then
  [[ "$credential_file" == /* && "$credential_file" != *[[:space:]]* && "$credential_file" != *,* ]] && [ -f "$credential_file" ] || { echo 'File identitas Google Docs tidak valid.' >&2; exit 1; }
  secret_mount=(--mount "type=bind,src=$credential_file,dst=$credential_file,readonly")
fi
# Refuse missing/different credentials or extra mounts rather than dropping them.
[ "$credential_file" = /opt/mahida-secrets/mahida-google-docs.json ] || { echo 'Kredensial Google Docs yang sudah aktif tidak ditemukan dalam env-file; produksi belum diubah.' >&2; exit 1; }
current_mounts="$(docker inspect -f '{{range .Mounts}}{{println .Type .Source .Destination .RW}}{{end}}' mahida-app)"
[ "$current_mounts" = "bind $credential_file $credential_file false" ] || { echo 'Mount produksi berbeda dari kunci Google Docs read-only yang diharapkan; produksi belum diubah.' >&2; exit 1; }
docker exec mahida-app node -e 'const fs=require("node:fs");if(process.env.GOOGLE_DOCS_CREDENTIALS_FILE!==process.argv[1])process.exit(1);fs.accessSync(process.argv[1],fs.constants.R_OK)' "$credential_file" >/dev/null 2>&1 || { echo 'Identitas Google Docs produksi belum terbaca; rilis dihentikan.' >&2; exit 1; }
echo 'Source dan kredensial cocok. Memuat image rilis...'
gzip -t "$ARCHIVE"
gzip -dc "$ARCHIVE" | docker load
test "$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' mahida-digital-ci:latest)" = "$EXPECTED" || { echo 'Image bukan build Maktabah yang diminta; produksi belum diubah.' >&2; exit 1; }
docker tag mahida-digital-ci:latest "$TAG"
if [ -n "$credential_file" ]; then
  docker run --rm "${secret_mount[@]}" --entrypoint sh "$TAG" -c 'test -r "$1"' sh "$credential_file" >/dev/null 2>&1 || { echo 'File identitas Google Docs harus dapat dibaca UID 1001. Periksa izin file.' >&2; exit 1; }
fi
install -m 600 "$ENV_FILE" "$BACKUP_DIR/maktabah-$STAMP.env"
docker inspect mahida-app > "$BACKUP_DIR/maktabah-$STAMP.container.json"
printf '%s\n' "$current_revision" > "$BACKUP_DIR/maktabah-$STAMP.previous-revision.txt"
echo 'Membuat backup database...'
docker run --rm --network "$NETWORK" --env-file "$ENV_FILE" postgres:16-alpine sh -c 'exec pg_dump -Fc --dbname="$DATABASE_URL"' > "$BACKUP"
chmod 600 "$BACKUP"
test -s "$BACKUP"
docker run --rm -i postgres:16-alpine pg_restore -l >/dev/null < "$BACKUP"
echo "Backup database tervalidasi: $BACKUP"
echo 'Menjalankan migrasi tambahan dan menyiapkan preview...'
docker run --rm --network "$NETWORK" --env-file "$ENV_FILE" "$TAG" node scripts/migrate.mjs
docker run -d "${secret_mount[@]}" --name "$PREVIEW" --network "$NETWORK" --env-file "$ENV_FILE" -e MAKTABAH_SYNC_ENABLED=false -p 127.0.0.1:3001:3000 "$TAG" >/dev/null
preview_created=1
health_ok() {
  local response
  response="$(curl -fsS --max-time 8 "$1/api/health" 2>/dev/null)" || return 1
  [[ "$response" == *'"ok":true'* && "$response" == *'"database":"connected"'* && "$response" == *'"qualityReady":true'* && "$response" == *'"maktabahReady":true'* && "$response" == *'"maktabahSearchReady":true'* ]]
}
routes_ok() {
  local route
  for route in / /api/promotion /maktabah /maktabah/fan /maktabah/pencarian /api/maktabah/pencarian?q=ilmu /karya/terjemahan; do
    curl -fsS --max-time 15 "$1$route" >/dev/null 2>&1 || return 1
  done
}
wait_ready() {
  local container="$1" base="$2" attempt
  for (( attempt=0; attempt<45; attempt++ )); do
    if [[ "$(docker inspect -f '{{.State.Health.Status}}' "$container")" == healthy ]] && health_ok "$base" && routes_ok "$base"; then return 0; fi
    sleep 2
  done
  docker logs --tail 60 "$container" || true
  return 1
}
if ! wait_ready "$PREVIEW" http://127.0.0.1:3001; then echo 'Preview gagal; kontainer produksi belum ditukar.' >&2; exit 1; fi
docker rm -f "$PREVIEW" >/dev/null
preview_created=0
echo 'Preview dan health lulus.'
# Save recovery information before stopping the healthy production app.
printf '%s\n' "$OLD" > "$BACKUP_DIR/maktabah-rollback-container.txt"
printf '%s\n' "$EXPECTED" "$SOURCE" "$TAG" > "$BACKUP_DIR/maktabah-release-source.txt"
docker stop mahida-app >/dev/null
if ! docker rename mahida-app "$OLD"; then docker start mahida-app >/dev/null; exit 1; fi
swapped=1
docker run -d "${secret_mount[@]}" --name mahida-app --network "$NETWORK" --env-file "$ENV_FILE" --restart unless-stopped -p 127.0.0.1:3000:3000 "$TAG" >/dev/null
docker exec mahida-app node -e 'const fs=require("node:fs");if(process.env.GOOGLE_DOCS_CREDENTIALS_FILE!==process.argv[1])process.exit(1);fs.accessSync(process.argv[1],fs.constants.R_OK)' "$credential_file" >/dev/null 2>&1 || { echo 'Identitas Google Docs tidak terbaca di aplikasi baru; rollback dijalankan.' >&2; exit 1; }
if ! wait_ready mahida-app http://127.0.0.1:3000 || ! health_ok https://mahida.my.id || ! routes_ok https://mahida.my.id; then echo 'Validasi produksi gagal; rollback dijalankan.' >&2; exit 1; fi
released=1
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
echo "RILIS BERHASIL; backup: $BACKUP; rollback: $OLD; source: $SOURCE"
