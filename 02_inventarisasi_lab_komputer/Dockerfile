FROM node:lts-alpine3.23
WORKDIR /app/

# Instal toolchain untuk kompilasi native modules
# build-base berisi gcc, g++, make, dll.
RUN apk add --no-cache \
    build-base \
    python3 \
    openssl \
    bash

# Setup pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package management files
COPY package.json pnpm-lock.yaml ./

# Karena better-sqlite3 butuh kompilasi, pnpm butuh izin build
# Ini sesuai dengan catatan di dokumentasi yang Anda lampirkan
RUN pnpm install --frozen-lockfile

# COPY . .

# Generate Prisma Client (targetkan ke output sesuai dokumentasi Anda)
# `RUN pnpm dlx prisma generate
