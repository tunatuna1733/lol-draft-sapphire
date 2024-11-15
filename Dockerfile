FROM node:18-slim as prod
ENV NODE_ENV=production
WORKDIR /home/node
RUN apt-get update && \
    apt-get install -qq -y --no-install-recommends \
    tini ca-certificates && \
    rm -rf /var/lib/apt/lists/*

USER node
ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "npm", "run", "start" ]