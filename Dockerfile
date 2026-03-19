# Stage 1: Build frontend (placeholder for now)
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
# When real frontend exists:
# COPY frontend/package*.json ./
# RUN npm ci
# COPY frontend/ .
# RUN npm run build
# For now, just create a placeholder dist
RUN mkdir -p dist
COPY resource/frontend/dist/index.html dist/

# Stage 2: Build Go binary
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
# Copy frontend dist into resource for embed
COPY --from=frontend /app/frontend/dist ./resource/frontend/dist
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o taptype .

# Stage 3: Minimal runtime image
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /app/taptype /taptype
COPY --from=builder /app/manifest/config/config.yaml /manifest/config/config.yaml
RUN mkdir -p /data
EXPOSE 8080
ENTRYPOINT ["/taptype"]
