#!/bin/bash

source $PLEX/docker/.env

docker run --rm -it -v "/home/$USER/plex/kometa/config:/config" kometateam/kometa:nightly --kometa-IP_ADDRESS $IP_ADDRESS \
  --kometa-PLEX_TOKEN $PLEX_TOKEN \
  --kometa-TMDB_API_KEY $TMDB_API_KEY \
  --kometa-RADARR_API_KEY $RADARR_API_KEY --run
