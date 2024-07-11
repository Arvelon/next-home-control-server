FROM node:lts-alpine
WORKDIR /usr/src/app

# Install necessary dependencies
RUN apk update && \
    apk add --no-cache git python3 python3-dev py3-distutils-extra

# # Set up Python environment and tools (if necessary)
# RUN python3 -m ensurepip && \
#     rm -r /usr/lib/python*/ensurepip && \
#     pip3 install --upgrade pip setuptools && \
#     ln -sf python3 /usr/bin/python

# Install git if needed
# RUN apt-get update && apt-get install -y git

# Clone the repository
RUN git clone https://github.com/Arvelon/next-home-control-server.git .

# Optionally, you can pull the latest changes on build
RUN git pull

RUN npm install

# Install sqlite3 and dependencies
# RUN npm install sqlite3

# COPY . .
EXPOSE 5001
CMD ["node", "app.mjs"]
