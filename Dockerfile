FROM node:20
WORKDIR /usr/src/app

# Install git if needed
RUN apt-get update && apt-get install -y git

# Clone the repository
RUN git clone https://github.com/Arvelon/next-home-control-server.git .

# Optionally, you can pull the latest changes on build
RUN git pull

RUN npm install
COPY . .
EXPOSE 5001
CMD ["node", "app.mjs"]
