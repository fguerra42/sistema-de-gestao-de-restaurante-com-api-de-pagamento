#!/bin/sh
echo "Running migrations..."
npx prisma migrate deploy

echo "Starting server..."
exec npx tsx server.ts