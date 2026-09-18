# One command to a running app, for people who do not want to install Node.
#
# NOT VERIFIED: the machine this was written on has the Docker CLI but no
# daemon, so this image has never been built. The Node path in the README is
# the one that has been tested end to end. If this fails, that is why.
#
#   docker build -t appscraper .
#   docker run -p 3000:3000 -v appscraper-data:/app/data appscraper
#
# The volume keeps the database — favourites, tracked apps, alerts and notes —
# across restarts. Without it the container starts fresh every time.

FROM node:22-slim AS build
WORKDIR /app

# better-sqlite3 is a native module: it needs a toolchain to compile against
# this image's Node, and prebuilt binaries do not cover every platform.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json

# Seed on first boot only. A mounted volume with a database already in it is
# left alone, so restarting never wipes what the user saved.
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
