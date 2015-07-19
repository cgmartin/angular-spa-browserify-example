FROM node:0.12

## Install forever
RUN npm install -g forever

## Set up application folder
RUN mkdir -p /app
WORKDIR /app

## Cache 3rd-party NPM modules
COPY package.json /app/
RUN npm install --production --unsafe-perm

## Copy source
COPY . /app/

## TODO: Cachebust this section to ensure using latest dependencies
RUN npm install spa-express-static-server@latest

## Run static service forever
CMD [ "forever", "-f", "src/server/static-server.js" ]

EXPOSE 8000
