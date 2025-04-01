# Use a Node.js base image
FROM node:16

# Set working directory inside the container
WORKDIR /app

# Install nvm and Node.js version 22.14.0
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash && \
    source ~/.nvm/nvm.sh && \
    nvm install 22.14.0 && \
    nvm use 22.14.0

# Copy the package.json and yarn.lock files to the container
COPY package.json yarn.lock ./

# Install Yarn globally
RUN npm install -g yarn

# Install project dependencies using Yarn
RUN yarn install

# Install Codemirror and react-codemirror2
RUN npm install codemirror@5 && yarn add react-codemirror2

# Copy the rest of the application code
COPY . .

# Expose the necessary port (e.g., 3000 or the port used by your app)
EXPOSE 3000

# Build the application (optional, if your app requires build step)
RUN yarn build

# Run the development server (if applicable)
CMD ["yarn", "dev"]
