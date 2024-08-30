# Use the official Node.js image with a specific version for better consistency
FROM node:18-alpine as build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Use a lightweight server image for the production build
FROM nginx:alpine

# Copy the built React app to NGINX's default public directory
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# No need to specify a CMD since the NGINX base image has a default command
