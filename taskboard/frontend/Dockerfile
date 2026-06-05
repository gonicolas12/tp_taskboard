FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY . .

USER node

EXPOSE 8080

CMD ["serve", "-s", ".", "-l", "8080"]