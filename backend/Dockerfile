# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm install --no-audit --no-fund

# Copy application code (exclude what's in .dockerignore)
COPY . .

# List what we copied (for debugging)
RUN echo "Source files:" && ls -la src/ | head -10

# Build application (with verbose output)
RUN npm run build 2>&1 | tee /tmp/build.log || (echo "Build command failed!" && cat /tmp/build.log && exit 1)

# Verify build succeeded
RUN echo "Checking dist directory..." && \
    ls -la dist/ || (echo "ERROR: dist directory not found" && exit 1) && \
    test -f dist/main.js || (echo "ERROR: dist/main.js not found" && ls -la dist/ && exit 1) && \
    echo "✅ Build verification passed - dist/main.js exists"

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Verify dist was copied
RUN ls -la dist/ && test -f dist/main.js || (echo "ERROR: dist/main.js not found after copy" && exit 1)

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
