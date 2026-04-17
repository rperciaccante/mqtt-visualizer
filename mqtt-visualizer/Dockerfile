ARG BUILD_FROM
FROM $BUILD_FROM

RUN apt-get update && apt-get install -y curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Install server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./

# Wire built frontend into server static directory
RUN cp -r /app/frontend/dist /app/server/public

WORKDIR /app
CMD ["node", "/app/server/src/index.js"]
