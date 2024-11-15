FROM node:18-slim as builder
COPY . .
RUN npm ci && \
    npm run build:release

FROM node:18-slim as deps
COPY package*.json .
RUN npm ci --omit=dev

FROM node:18-slim as prod
ENV NODE_ENV=production
WORKDIR /home/node
RUN apt-get update && \
    apt-get install -qq -y --no-install-recommends \
    tini ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=deps --chown=node:node node_modules /home/node/node_modules
COPY --from=builder --chown=node:node package.json /home/node/package.json
COPY --from=builder --chown=node:node dist /home/node/dist

USER node
ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "npm", "run", "start" ]