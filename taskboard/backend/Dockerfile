FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY .env.example ./.env.example
COPY package*.json ./

USER node

EXPOSE 3000

CMD ["node", "src/app.js"]