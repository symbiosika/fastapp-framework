
```
docker compose up -d
docker compose exec app bun install
docker compose exec app bun install npm -g
docker compose exec app npm run fastapp:migrate
docker compose exec app bun test
docker compose exec app bun test src/test/check-connection.test.ts

docker compose down
docker compose down -v
```
