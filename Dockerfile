FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json, then install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project files
COPY . .

# Build TypeScript files
RUN npm run build

# Expose the port
EXPOSE 5000

# Start the app using the compiled JavaScript file in the dist folder
CMD ["node", "dist/app.js"]
