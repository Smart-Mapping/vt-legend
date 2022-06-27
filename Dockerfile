FROM node:16-alpine as build
WORKDIR /app
COPY package.json .
RUN npm install
COPY src ./src
RUN npm run-script build

#######

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]