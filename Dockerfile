# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
# to leverage Docker cache for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app for production
# Assuming your build output goes into a 'dist' folder (common with Vite)
# If using Create React App, it will be 'build'
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built files from the build stage into Nginx's public directory
# Adjust 'dist' to 'build' if Create React App is used
COPY --from=build /app/build /usr/share/nginx/html

# Optional: Copy a custom Nginx configuration if you have one
# If your app uses client-side routing (e.g., React Router), you'll likely need this
# to handle refreshing at specific routes correctly.
# Create a file named 'nginx.conf' in your project root with the content below
#COPY docker-compose/conf/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default)
EXPOSE 80

# Command to start Nginx (default command for nginx:alpine)
CMD ["nginx", "-g", "daemon off;"]