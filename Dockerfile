# Dockerfile - packs EventEase and Node.js into one container image.

# 1. Start from the official Node.js 22 image (small Alpine Linux version).
FROM node:22-alpine

# 2. Every following command runs inside the /app folder of the container.
WORKDIR /app

# 3. Copy only the package files first and install production dependencies.
#    Docker caches this step, so rebuilds are fast when only code changes.
COPY package*.json ./
RUN npm ci --omit=dev

# 4. Copy the rest of the code (.dockerignore leaves out node_modules, tests, .git).
COPY . .

# 5. The pipeline passes the commit ID while building:
#    docker build --build-arg GIT_SHA=<commit> ...
ARG GIT_SHA=local
ENV GIT_SHA=$GIT_SHA \
    NODE_ENV=production \
    PORT=3000

# 6. Run as the built-in unprivileged "node" user instead of root (safer).
USER node

# 7. Document the port and start the server.
EXPOSE 3000
CMD ["node", "server.js"]
