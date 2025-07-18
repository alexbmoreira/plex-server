# Plex Server

A (close to) plug-and-play Plex setup using Docker that includes:

- **Plex**
- **ProtonVPN** for Deluge
- **Deluge** as a download client
- **Prowlarr** for indexing torrents
- **Radarr** for movies and **Sonarr** for TV shows
- **Overseerr** for adding movies and TV
- **Kometa** for managing Plex collections
- **Bazarr** for subtitles
- **Cloudflare** tunnels for remote access
- **Tautilli** for monitoring and notifications
- **ErsatzTV** for live channels based on things in your library
- **Wizarr** for onboarding new users to your Plex server
- My own **[Plex Home Theatre](https://github.com/alexbmoreira/plex-home-theatre)** for scheduling movies to be played at a selected time, plus printing tickets with seat numbers.

## Getting Started

This guide covers basic setup for each app. For more advanced configuration, check the official docs linked above. You can install just Plex or the full suite — each app works independently, with some exceptions (e.g. download clients should use a VPN).

You can organize your setup however you like, but this guide assumes all files live under `~/plex`. If I refer to the “root folder,” that’s what I mean.

### Hardware

Everything in this guide runs in Docker containers, so it should work on Mac, Linux, or Windows (though I haven’t tested Windows). You can use almost any machine, but for a full setup that stays on 24/7, you’ll want something with enough storage and processing power for media transcoding.

For storage, NAS-rated drives are ideal if budget allows, since they’re built for constant use. For transcoding, an Intel CPU with a QuickSync-enabled iGPU offers excellent value, easily handling multiple 4K streams without a dedicated GPU. Most users won’t need more, but you can read more about transcoding [here](https://www.reddit.com/r/PleX/comments/11ih0gs/plex_hardware_transcoding_explained/) or in the [Plex docs](https://support.plex.tv/articles/200430303-streaming-overview/).

I use a Beelink Mini S12 with Seagate Ironwolf drives in a DAS. It’s plenty for a few hundred movies and sharing with friends. I’ve also run Plex on a Raspberry Pi for personal use — go with what fits your needs and comfort level.

### Using Docker

If you’re new to Docker, follow the [official install guide](https://docs.docker.com/engine/install/) for your OS. Once installed, create your Docker directory:

```bash
mkdir -p ~/plex/docker
```

Then create the Docker Compose and `.env` files:

```bash
touch ~/plex/docker/{docker-compose.yml,.env}
```

You’ll add services to the Compose file later. For now, set Docker to start on boot so your server comes back online after a reboot:

```bash
sudo systemctl enable docker.service
```

## Plex

Before setting up Plex, make sure your external drives are mounted if you're using any. I’ve mounted mine to `~/plex/data`, but you can choose any location. Just keep in mind: for Radarr/Sonarr hardlinks to work, your media and download directories must be on the same drive. More on that later.

Once your drives are mounted, create the media folders for Plex:

```bash
mkdir -p ~/plex/data/media/{movies,tv}
```

If you use Plex on its own, follow their [instructions for organizing your media](https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/).

These variables aren't strictly necessary, but since they'll be reused often, it helps keep things clean:

```bash
PUID=1000
PGID=1000
TZ="America/Toronto"
```

Run Plex with Docker:

```yaml
---
services:
  plex:
    image: lscr.io/linuxserver/plex:latest
    container_name: plex
    network_mode: host
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - VERSION=docker
    volumes:
      - ${HOME}/plex/config:/config
      - ${HOME}/plex/data/media:/data/media
    restart: unless-stopped
```

If you're only running Plex and plan to add media manually, you can stop here. Just open Plex in your browser at port 32400 and set up your libraries to start watching.


