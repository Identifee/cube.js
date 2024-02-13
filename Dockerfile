FROM node:16
WORKDIR /app
COPY . /app

RUN yarn install --frozen-lockfile
RUN yarn build
RUN yarn lerna run --concurrency 1 build
RUN cp -r /app/packages/cubejs-server-core/dist /tmp
