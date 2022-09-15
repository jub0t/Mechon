FROM node:16
WORKDIR /src
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 2278
CMD ["node","index.js"]