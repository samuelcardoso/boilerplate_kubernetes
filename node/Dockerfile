FROM node:8-alpine

ENV NODE_ENV production

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app/

VOLUME ["/usr/src/app/logs"]

EXPOSE 7000
CMD [ "npm", "run", "start:docker" ]
