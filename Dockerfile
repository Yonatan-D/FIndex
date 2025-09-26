FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm && \
    pnpm install --production

FROM gcr.chenby.cn/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["server.js"]
