# --- Stage 1: Build the React App ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
# Vite builds to the "dist" folder by default
RUN npm run build 

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]