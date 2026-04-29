FROM node:24-alpine AS deps
WORKDIR /app
COPY packages/x402-solana/package*.json ./packages/x402-solana/
COPY packages/x402-solana/tsconfig.json ./packages/x402-solana/
COPY packages/x402-solana/src ./packages/x402-solana/src
COPY packages/testing-specialists/package*.json ./packages/testing-specialists/
COPY packages/testing-specialists/tsconfig.json ./packages/testing-specialists/
RUN cd packages/x402-solana && npm ci && npm run build
RUN cd packages/testing-specialists && npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app /app
COPY packages/testing-specialists/src ./packages/testing-specialists/src
RUN cd packages/testing-specialists && npm run build

FROM node:24-alpine
WORKDIR /app/packages/testing-specialists
RUN apk add --no-cache curl
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0
COPY --from=build /app/packages/x402-solana /app/packages/x402-solana
COPY --from=build /app/packages/testing-specialists /app/packages/testing-specialists
EXPOSE 8080
CMD ["node", "dist/server.js"]
