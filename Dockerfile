FROM node:0.12

RUN npm install -g forever
RUN mkdir -p /app
WORKDIR /app

COPY package.json /app/
RUN npm install --production
COPY . /app/

CMD [ "forever", "-f", "src/server/static-server.js" ]

EXPOSE 8000
