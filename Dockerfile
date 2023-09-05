FROM node:lts-alpine as build
LABEL org.opencontainers.image.authors="https://github.com/TrueDru"

COPY . /src/
WORKDIR /src
RUN npm install 
ENTRYPOINT [ "npm", "run", "dev" ]