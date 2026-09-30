#!/usr/bin/env bash
# Run on the Mahida VPS after downloading the PR 14 image artifact and merging the PR.
set -euo pipefail

REPO=/opt/Maktabah-Mahida
APP="$REPO/mahida-digital-website-blueprint"
ARCHIVE="${1:-/root/mahida-backups/mahida-pr14-image.tar.gz}"
BACKUP_DIR=/root/mahida-backups
PREVIEW=mahida-pr14-preview
OLD="mahida-app-before-pr14-$(date +%Y%m%d%H%M%S)"
BACKUP="$BACKUP_DIR/pr14-$(date +%Y%m%d%H%M%S).dump"
swapped=0
released=0

cleanup() {
  code=$?
  docker rm -f "$PREVIEW" >/dev/null 2>&1 || true
  if (( swapped && !released )); then
    docker rm -f mahida-app >/dev/null 2>&1 || true
    if docker rename "$OLD" mahida-app && docker start mahida-app >/dev/null; then
      echo 'RILIS GAGAL; kontainer lama dipulihkan' >&2
    else
      echo "ROLLBACK MANUAL DIPERLUKAN: kontainer lama $OLD" >&2
    fi
  fi
  exit "$code"
}
trap cleanup EXIT

mkdir -p "$BACKUP_DIR"
test -s "$ARCHIVE"
gzip -t "$ARCHIVE"
test "$(git -C "$REPO" branch --show-current)" = 'chore/production-readiness'
test -f "$APP/.env.production"

docker run --rm --network mahida-network --env-file "$APP/.env.production" \
  postgres:16-alpine sh -c 'exec pg_dump -Fc --dbname="$DATABASE_URL"' > "$BACKUP"
test -s "$BACKUP"
docker run --rm -i postgres:16-alpine pg_restore -l >/dev/null < "$BACKUP"
echo "Cadangan database: $BACKUP"

gzip -dc "$ARCHIVE" | docker load
SOURCE_SHA="$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' mahida-digital-ci:latest)"
test "$SOURCE_SHA" != '<no value>'
git -C "$REPO" merge-base --is-ancestor "$SOURCE_SHA" HEAD
TAG="mahida:pr14-${SOURCE_SHA:0:7}"
docker tag mahida-digital-ci:latest "$TAG"
echo "Image tervalidasi: $TAG ($SOURCE_SHA)"

docker run --rm --network mahida-network --env-file "$APP/.env.production" "$TAG" node scripts/migrate.mjs
docker run -d --name "$PREVIEW" --network mahida-network --env-file "$APP/.env.production" -p 127.0.0.1:3001:3000 "$TAG" >/dev/null

ready=0
for (( i=0; i<45; i++ )); do
  if curl -fsS --max-time 6 http://127.0.0.1:3001/api/health >/dev/null 2>&1 &&
     curl -fsS --max-time 15 http://127.0.0.1:3001/ >/dev/null 2>&1 &&
     curl -fsS --max-time 15 http://127.0.0.1:3001/tentang/pendaftaran >/dev/null 2>&1 &&
     curl -fsS --max-time 15 http://127.0.0.1:3001/karya >/dev/null 2>&1 &&
     curl -fsS --max-time 15 http://127.0.0.1:3001/media/galeri >/dev/null 2>&1; then
    ready=1; break
  fi
  sleep 2
done
if (( !ready )); then
  docker logs --tail 40 "$PREVIEW" || true
  echo 'PRATINJAU GAGAL; produksi belum diubah' >&2
  exit 1
fi
docker rm -f "$PREVIEW" >/dev/null
echo 'Pratinjau lulus'

docker stop mahida-app >/dev/null
if ! docker rename mahida-app "$OLD"; then
  docker start mahida-app >/dev/null
  exit 1
fi
swapped=1
echo "$OLD" > "$BACKUP_DIR/pr14-rollback-container.txt"
docker run -d --name mahida-app --network mahida-network --env-file "$APP/.env.production" \
  --restart unless-stopped -p 127.0.0.1:3000:3000 "$TAG" >/dev/null

ready=0
for (( i=0; i<35; i++ )); do
  if curl -fsS --max-time 6 http://127.0.0.1:3000/api/health >/dev/null 2>&1 &&
     curl -fsS --max-time 10 https://mahida.my.id/api/health >/dev/null 2>&1 &&
     curl -fsS --max-time 15 https://mahida.my.id/tentang/pendaftaran >/dev/null 2>&1 &&
     curl -fsS --max-time 15 https://mahida.my.id/karya >/dev/null 2>&1; then
    ready=1; break
  fi
  sleep 2
done
if (( !ready )); then
  docker logs --tail 40 mahida-app || true
  exit 1
fi
released=1
docker inspect -f '{{.Config.Image}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' mahida-app
echo "RILIS BERHASIL; database: $BACKUP; kontainer cadangan: $OLD"
