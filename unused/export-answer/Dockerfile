FROM node:20-alpine

# Install Python and required packages
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy source code
COPY . .

# Create output directory
RUN mkdir -p /app/pdfs

# Default command for docker compose run
CMD ["node", "index.js"]