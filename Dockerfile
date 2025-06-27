FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Environment variables with defaults
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "app.js"]