# Keep all stages on the same supported Alpine branch with patched musl.
ARG NODE_IMAGE=node:24-alpine3.23
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
ARG APK_CACHE_BUST=2026-11-24
RUN sed -i '/\/community$/d' /etc/apk/repositories \
  && apk update \
  && apk upgrade \
  && apk add --upgrade 'openssl>=3.5.9-r1' 'libssl3>=3.5.9-r1' 'libcrypto3>=3.5.9-r1' \
       'musl>=1.2.5-r24' 'zlib>=1.4-r0' \
  && rm -rf /var/cache/apk/* /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Preserve certificates and system configuration, then remove unused runtime tools.
RUN apk add --no-network --no-scripts alpine-baselayout-data ca-certificates-bundle \
  && rm -f /usr/local/bin/docker-entrypoint.sh \
  && apk del --no-network --no-scripts alpine-baselayout apk-tools busybox-binsh busybox
VOLUME ["/app/data"]
EXPOSE 3010 6667
ENTRYPOINT []
CMD ["node", "dist/main.js"]
