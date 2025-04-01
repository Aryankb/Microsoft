# Use Node.js base image
FROM node:22.14.0

# Set working directory inside the container
WORKDIR /app

# Install nvm and Node.js version 22.14.0
# RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash && \
#     source ~/.nvm/nvm.sh && \
#     nvm install 22.14.0 && \
#     nvm use 22.14.0

# Install Yarn globally
RUN npm install -g yarn

# Copy package.json and yarn.lock to the container
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Install Codemirror and react-codemirror2
# RUN npm install codemirror@5 && yarn add react-codemirror2

# Copy the rest of the application code
COPY . .

# Expose port 5173 (default port for Vite dev server)
EXPOSE 5173

# Start the development server using yarn (which uses Vite by default)
CMD ["yarn", "dev"]
