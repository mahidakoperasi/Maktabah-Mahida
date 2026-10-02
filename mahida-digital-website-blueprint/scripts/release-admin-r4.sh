#!/usr/bin/env bash
# Bundle-first release: no git pull, no cleanup of production data or images.
set -euo pipefail
umask 077
REPO=/opt/Maktabah-Mahida
APP="$REPO/mahida-digital-website-blueprint"
BACKUP_DIR=/root/mahida-backups
NETWORK=mahida-network
STAMP="$(date +%Y%m%d%H%M%S)"
PREVIEW="mahida-admin-r4-preview-$STAMP"
OLD="mahida-app-before-admin-r4-$STAMP"
BACKUP="$BACKUP_DIR/admin-r4-$STAMP.dump"
swapped=0
released=0
preview_created=0

cleanup() {
  code=$?
  trap - EXIT
  if (( preview_created )); then docker rm -f "$PREVIEW" >/dev/null 2>&1 || true; fi
  if (( swapped && !released )); then
    docker rm -f mahida-app >/dev/null 2>&1 || true
    if docker rename "$OLD" mahida-app && docker start mahida-app >/dev/null; then
      echo 'RILIS GAGAL; container lama dipulihkan. Migrasi tambahan tetap ada dan kompatibel.' >&2
    else
      echo "ROLLBACK MANUAL DIPERLUKAN; container cadangan: $OLD" >&2
    fi
  fi
  exit "$code"
}
trap cleanup EXIT
test "$(id -u)" -eq 0
mkdir -p "$BACKUP_DIR"
exec 9>/var/lock/mahida-release.lock
flock -n 9 || { echo 'Rilis lain masih berjalan.' >&2; exit 1; }
test "$(git -C "$REPO" branch --show-current)" = chore/production-readiness
test -z "$(git -C "$REPO" status --porcelain --untracked-files=no)" || { echo 'Perubahan source lokal ditemukan. Hentikan; jangan hapus/reset perubahan.' >&2; exit 1; }
EXPECTED="$(git -C "$REPO" rev-parse "${1:?Masukkan SHA commit bundle Rilis 4 sebagai argumen}^{commit}")"
SOURCE_SHA="$(git -C "$REPO" rev-parse HEAD)"
test "$SOURCE_SHA" = "$EXPECTED" || { echo 'HEAD tidak cocok dengan commit bundle yang diminta.' >&2; exit 1; }
test -f "$APP/.env.production"
test "$(docker inspect -f '{{.State.Status}} {{.State.Health.Status}}' mahida-app)" = 'running healthy'
docker network inspect "$NETWORK" >/dev/null
TAG="mahida:admin-r4-${SOURCE_SHA:0:7}"

# Build first, while the current app keeps serving. Back up immediately before migration.
docker build --build-arg RELEASE_SHA="$SOURCE_SHA" -t "$TAG" "$APP"
test "$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$TAG")" = "$SOURCE_SHA"
docker run --rm --network "$NETWORK" --env-file "$APP/.env.production" postgres:16-alpine sh -c 'exec pg_dump -Fc --dbname="$DATABASE_URL"' > "$BACKUP"
chmod 600 "$BACKUP"
test -s "$BACKUP"
docker run --rm -i postgres:16-alpine pg_restore -l >/dev/null < "$BACKUP"
echo "Backup tervalidasi: $BACKUP"
docker run --rm --network "$NETWORK" --env-file "$APP/.env.production" "$TAG" node scripts/migrate.mjs
docker run -d --name "$PREVIEW" --network "$NETWORK" --env-file "$APP/.env.production" -p 127.0.0.1:3001:3000 "$TAG" >/dev/null
preview_created=1

health_ok() {
  local response
  response="$(curl -fsS --max-time 8 "$1/api/health" 2>/dev/null)" || return 1
  [[ "$response" == *'"ok":true'* && "$response" == *'"database":"connected"'* && "$response" == *'"galleryFolderReady":true'* && "$response" == *'"visualClippingReady":true'* && "$response" == *'"publicationReady":true'* ]]
}
routes_ok() {
  local route
  for route in / /karya /media /media/galeri /media/video /koperasi /tentang/sejarah /tentang/profil /tentang/kontak /tentang/pendaftaran; do
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
if ! wait_ready "$PREVIEW" http://127.0.0.1:3001; then echo 'PRATINJAU GAGAL; container produksi belum ditukar.' >&2; exit 1; fi
docker rm -f "$PREVIEW" >/dev/null
preview_created=0
echo 'Pratinjau dan health Docker lulus.'
docker stop mahida-app >/dev/null
if ! docker rename mahida-app "$OLD"; then docker start mahida-app >/dev/null; exit 1; fi
swapped=1
printf '%s\n' "$OLD" > "$BACKUP_DIR/admin-r4-rollback-container.txt"
docker run -d --name mahida-app --network "$NETWORK" --env-file "$APP/.env.production" --restart unless-stopped -p 127.0.0.1:3000:3000 "$TAG" >/dev/null
if ! wait_ready mahida-app http://127.0.0.1:3000 || ! health_ok https://mahida.my.id || ! routes_ok https://mahida.my.id; then echo 'VALIDASI PRODUKSI GAGAL; rollback dijalankan.' >&2; exit 1; fi
released=1
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{.State.Health.Status}}' mahida-app
echo "RILIS BERHASIL; backup: $BACKUP; rollback: $OLD"
