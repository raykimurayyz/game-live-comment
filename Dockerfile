ARG NODE_IMAGE=node:24-alpine3.24
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV CONFIG_PATH=/app/data/config.json
ENV HTTP_PORT=3010
ENV IRC_PORT=6667
ARG APK_CACHE_BUST=2026-11-04
RUN apk update \
  && apk upgrade \
  && apk add --upgrade openssl libssl3 libcrypto3 'musl>=1.2.6-r3' 'zlib>=1.3.2-r1' \
  && rm -rf /var/cache/apk/* /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
VOLUME ["/app/data"]
EXPOSE 3010 6667
CMD ["node", "dist/main.js"]
