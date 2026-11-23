# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

# Runtime deps for the migrate/setup scripts (the app itself runs from the traced standalone bundle).
FROM node:24-bookworm-slim AS scriptdeps
WORKDIR /s
RUN npm init -y >/dev/null && npm i --omit=dev drizzle-orm@0 postgres@3 @aws-sdk/client-s3@3

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN useradd -r -u 1001 app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=scriptdeps /s/node_modules ./scripts/node_modules
COPY scripts/migrate.mjs scripts/setup-users.mjs ./scripts/
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
