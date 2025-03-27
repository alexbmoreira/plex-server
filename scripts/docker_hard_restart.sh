#!/bin/bash

docker ps -a --format "{{.ID}} {{.Names}}" | grep -v -e "plex" | awk "{print \$2}" | xargs docker stop
docker ps -a --format "{{.ID}} {{.Names}}" | grep -v -e "plex" | awk "{print \$2}" | xargs docker rm
cd ~/plex/docker && docker compose up -d
