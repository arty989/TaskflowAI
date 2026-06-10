## Multi-stage Dockerfile for TaskflowAI
# Stage 1: build the React app using Node.js
FROM node:20 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package metadata first and install dependencies. This layer will be reused if
# package.json or package-lock.json haven't changed, speeding up subsequent builds.
COPY package.json package-lock.json ./
RUN npm install

# Copy environment variables into the builder stage so Vite can read them at build time.
# Do **not** commit your real secrets; this file should only exist locally.
COPY .env .env

# Copy the rest of the application source code
COPY . .

# Build the production React application
RUN npm run build

# Stage 2: serve the built app using nginx
FROM nginx:alpine

# Copy the compiled static files from the builder stage to nginx's HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom nginx configuration. This configuration serves the React app
# correctly (including history API fallback) and exposes a health endpoint.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port that nginx listens on inside the container
EXPOSE 80

# Define a simple health check endpoint. When this script is executed, curl
# checks that the container responds at /health with a 200 status; otherwise
# Docker will mark the container as unhealthy.
HEALTHCHECK CMD wget -qO- http://localhost/health || exit 1
