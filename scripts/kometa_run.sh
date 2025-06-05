#!/bin/bash

source $PLEX/docker/.env

docker run --rm -it -v "/home/$USER/plex/kometa/config:/config" kometateam/kometa:nightly --kometa-IP_ADDRESS $IP_ADDRESS \
  --kometa-PLEXTOKEN $PLEX_TOKEN \
  --kometa-TMDBKEY $TMDB_API_KEY \
  --kometa-RADARRKEY $RADARR_API_KEY --run
