    FROM node:22.14.0-alpine

    WORKDIR /app

    COPY package*.json ./

    
    RUN npm install

    
    COPY . .

    EXPOSE 5000

    CMD ["node","app.js"]