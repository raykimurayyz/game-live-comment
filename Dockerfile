FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV CONFIG_PATH=/app/data/config.json
ENV HTTP_PORT=3010
ENV IRC_PORT=6667
ARG APK_CACHE_BUST=manual
RUN apk upgrade --no-cache \
  && apk add --no-cache --upgrade openssl libssl3 libcrypto3 \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
VOLUME ["/app/data"]
EXPOSE 3010 6667
CMD ["node", "dist/main.js"]
