#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

npx prisma migrate deploy
npx prisma db seed

if [ -f "dist/src/main.js" ]; then
  node dist/src/main.js
elif [ -f "dist/main.js" ]; then
  node dist/main.js
else
  echo "Cannot find built entrypoint. Expected dist/src/main.js or dist/main.js"
  ls -la dist || true
  exit 1
fi
