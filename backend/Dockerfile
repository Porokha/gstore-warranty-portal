FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production --no-audit --no-fund

# Copy application code
COPY . .

# Build application (if needed)
RUN npm run build || true

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
