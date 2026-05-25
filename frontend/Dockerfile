# Use node 20-alpine to ensure native crypto APIs and lightweight footprint
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package info
COPY package.json ./

# Copy source code files
COPY server.js index.html style.css app.js ./

EXPOSE 3000

CMD [ "npm", "start" ]
