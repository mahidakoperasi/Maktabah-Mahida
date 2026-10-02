#!/usr/bin/env bash
# Jalankan sebagai root di VPS Mahida. Skrip ini tidak menghapus data, image,
# atau container rollback. Ia hanya memperbarui branch, mencadangkan database,
# membuat image, melakukan pratinjau, lalu menukar container dengan rollback otomatis.
set -euo pipefail

REPO=/opt/Maktabah-Mahida
APP="$REPO/mahida-digital-website-blueprint"
BRANCH=chore/production-readiness
NETWORK=mahida-network
BACKUP_DIR=/root/mahida-backups
PREVIEW=mahida-admin-r1-preview
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP="$BACKUP_DIR/admin-r1-$STAMP.dump"
OLD="mahida-app-before-admin-r1-$STAMP"
LOCK=/var/lock/mahida-admin-r1-release.lock
swapped=0
released=0

cleanup() {
  code=$?
  docker rm -f "$PREVIEW" >/dev/null 2>&1 || true
  if (( swapped && !released )); then
    docker rm -f mahida-app >/dev/null 2>&1 || true
    if docker rename "$OLD" mahida-app && docker start mahida-app >/dev/null; then
      echo 'RILIS GAGAL; kontainer produksi lama dipulihkan.' >&2
    else
      echo "ROLLBACK MANUAL DIPERLUKAN: jalankan docker rename $OLD mahida-app && docker start mahida-app" >&2
    fi
  fi
  exit "$code"
}
trap cleanup EXIT

exec 9>"$LOCK"
flock -n 9 || { echo 'Ada proses rilis Mahida lain yang masih berjalan.' >&2; exit 1; }

test "$(id -u)" -eq 0
test -d "$REPO/.git"
test -f "$APP/.env.production"
test "$(git -C "$REPO" branch --show-current)" = "$BRANCH"
mkdir -p "$BACKUP_DIR"

git -C "$REPO" fetch origin "$BRANCH"
git -C "$REPO" pull --ff-only origin "$BRANCH"
SOURCE_SHA="$(git -C "$REPO" rev-parse HEAD)"
TAG="mahida:admin-r1-${SOURCE_SHA:0:7}"

docker run --rm --network "$NETWORK" --env-file "$APP/.env.production" \
  postgres:16-alpine sh -c 'exec pg_dump -Fc --dbname="$DATABASE_URL"' > "$BACKUP"
test -s "$BACKUP"
docker run --rm -i postgres:16-alpine pg_restore -l >/dev/null < "$BACKUP"
echo "Cadangan database: $BACKUP"

docker build --build-arg RELEASE_SHA="$SOURCE_SHA" -t "$TAG" "$APP"
test "$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$TAG")" = "$SOURCE_SHA"
echo "Image tervalidasi: $TAG ($SOURCE_SHA)"

docker run --rm --network "$NETWORK" --env-file "$APP/.env.production" \
  "$TAG" node scripts/migrate.mjs

docker run -d --name "$PREVIEW" --network "$NETWORK" --env-file "$APP/.env.production" \
  -p 127.0.0.1:3001:3000 "$TAG" >/dev/null
preview_ready=0
for _ in $(seq 1 45); do
  if curl -fsS --max-time 6 http://127.0.0.1:3001/api/health >/dev/null && \
     curl -fsS --max-time 15 http://127.0.0.1:3001/ >/dev/null && \
     curl -fsS --max-time 15 http://127.0.0.1:3001/admin >/dev/null && \
     curl -fsS --max-time 15 http://127.0.0.1:3001/karya >/dev/null && \
     curl -fsS --max-time 15 http://127.0.0.1:3001/media/galeri >/dev/null; then
    preview_ready=1
    break
  fi
  sleep 2
done
if (( !preview_ready )); then
  docker logs --tail 80 "$PREVIEW" || true
  echo 'PRATINJAU GAGAL; produksi belum diubah.' >&2
  exit 1
fi
docker rm -f "$PREVIEW" >/dev/null
echo 'Pratinjau lulus.'

docker stop mahida-app >/dev/null
docker rename mahida-app "$OLD"
swapped=1
printf '%s\n' "$OLD" > "$BACKUP_DIR/admin-r1-rollback-container.txt"
docker run -d --name mahida-app --network "$NETWORK" --env-file "$APP/.env.production" \
  --restart unless-stopped -p 127.0.0.1:3000:3000 "$TAG" >/dev/null

for _ in $(seq 1 35); do
  if curl -fsS --max-time 6 http://127.0.0.1:3000/api/health >/dev/null && \
     curl -fsS --max-time 15 https://mahida.my.id/api/health >/dev/null && \
     curl -fsS --max-time 15 https://mahida.my.id/ >/dev/null && \
     curl -fsS --max-time 15 https://mahida.my.id/karya >/dev/null; then
    released=1
    break
  fi
  sleep 2
done
if (( !released )); then
  docker logs --tail 80 mahida-app || true
  echo 'Validasi produksi gagal.' >&2
  exit 1
fi

docker inspect -f '{{.Config.Image}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' mahida-app
echo "RILIS BERHASIL; backup: $BACKUP; rollback: $OLD"
