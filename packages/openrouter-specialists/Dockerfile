FROM node:22-alpine AS build
WORKDIR /app
COPY packages/openrouter-specialists/package*.json ./
RUN npm ci --ignore-scripts
COPY packages/openrouter-specialists/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
CMD ["node", "dist/src/server.js"]
