dev:
	go run cmd/api/main.go
dockerfile:
	docker build . -t king-back-end
dockerfile-rebuild:
	docker build --no-cache . -t king-back-end
dockerfile-run:
	docker run --rm king-back-end
docker-compose:
	docker-compose up -d
docker-compose-build:
	docker-compose up --build -d
