FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV PORT=5005

EXPOSE $PORT

CMD [ "npm", "start" ]
