FROM node:20-alpine
WORKDIR /usr/src/app

# Install git if needed
RUN apk update && apk add --no-cache git

# Clone the repository
RUN git clone https://github.com/Arvelon/next-home-control-server.git .

# Optionally, you can pull the latest changes on build
RUN git pull

RUN npm install

# Install sqlite3 and dependencies
# RUN npm install sqlite3

COPY . .
EXPOSE 5001
CMD ["node", "app.mjs"]
