#!/bin/bash

docker ps -a --format "{{.ID}} {{.Names}}" | grep -v -e "plex" | awk "{print \$2}" | xargs docker compose down -f $PLEX/docker/docker-compose.yml
docker compose up -d -f $PLEX/docker/docker-compose.yml
