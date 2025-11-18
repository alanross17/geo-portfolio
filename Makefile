prod-build:
	docker build -f Dockerfile -t geo-portfolio:prod .

prod-up: prod-build
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down