FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY server.js ./
COPY public ./public

# Prepare persistent data directory
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 4000

CMD ["node", "server.js"]
