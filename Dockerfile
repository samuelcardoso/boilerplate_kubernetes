FROM node:12.0-slim
COPY . .
RUN npm install
CMD [ "node", "index.js" ]
EXPOSE 3000