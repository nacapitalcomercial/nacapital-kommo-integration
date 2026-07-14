FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY README.md ./

EXPOSE 3000

CMD ["npm", "start"]

