.PHONY: dev build docker test migrate-status migrate-up migrate-down migrate-create

ROOT_DIR    = $(shell pwd)
NAMESPACE   = "default"
DEPLOY_NAME = "taptype"
DOCKER_NAME = "taptype"

include ./hack/hack-cli.mk
include ./hack/hack.mk

# Local development
dev:
	go run main.go

# Production build
build:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
		go build -ldflags="-s -w" -o bin/taptype .

# Docker
docker:
	docker build -t taptype:latest .

# Tests
test:
	go test ./utility/... -v -cover
	go test ./internal/service/... -v

# Migration commands
migrate-status:
	goose -dir migrations sqlite3 ./data/taptype.db status

migrate-up:
	goose -dir migrations sqlite3 ./data/taptype.db up

migrate-down:
	goose -dir migrations sqlite3 ./data/taptype.db down

migrate-create:
	goose -dir migrations create $(name) sql