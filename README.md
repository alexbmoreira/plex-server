# Plex Home Theater

A (close to) plug-and-play Plex setup using Docker that includes:

- **Plex**
- **Prowlarr** for indexing torrents
- **Radarr** for movies and **Sonarr** for TV shows
- **Bazarr** for subtitles
- **Deluge** as a download client
- **ProtonVPN** for Deluge
- **Overseerr** for adding movies and TV
- **Kometa** for managing Plex collections
- **Cloudflare** tunnels for remote access
- **Tautilli** for monitoring and notifications
- **ErsatzTV** for live channels based on things in your library
- **Wizarr** for onboarding new users to your Plex server
- My own **[Plex Home Theatre](https://github.com/alexbmoreira/plex-home-theatre)** for scheduling movies to be played at a selected time, plus printing tickets with seat numbers.

This guide will walk through basic setup for each app, but won't go beyond basic configuration. The docs linked above for each app do a great job at walking you though how they work in much more detail than I ever could. Each section will walk through setting up each app. You can stop after installing Plex on it's own, or you can run though the full suite of apps and supercharge your server, but you should be able to run anything independently of one another (With some exceptions, download client will rely on a VPN, etc.).

## Hardware

Everything in this guide is run in Docker containers so it should run fine on Mac, Linux, or Windows, though I've not tested the latter at all. Depending on your budget and use case there's a short list of things to keep in mind when picking the machine on which you want to run your server, but you can really use anything. If you want to utilize everything in this guide, however, you'll need something that can stay on 24/7.

The two most important things here are storage space and computing power, specifically for transcoding media.

There's not much to look for for storage, but if it's in your budget, I'd recommend NAS-specific drives since they're meant to be on 24/7.

For transcoding, the best value option is an Intel with a QuickSync-enabled iGPU as they can handle transcoding multiple 4K streams at once without the need for a GPU. This will be more than good enough for most people, but if you think you fall into a unique use case you can read a great summary on transcoding [here](https://www.reddit.com/r/PleX/comments/11ih0gs/plex_hardware_transcoding_explained/), or on the [Plex docs](https://support.plex.tv/articles/200430303-streaming-overview/).

I personally run my server on a Beelink Mini S12 with a couple Seagate Ironwolf drives in a NAS. To keep a couple hundred movies and share my library with a few friends, this is more than enough, so if that's what you want to do I can't recommend this setup enough. I've also run a perfectly functional server on a Raspberry Pi when it was just me streaming for myself. Use whatever you're most comfortable with.

## Plex

The first step to getting Plex up and running is to mount your external drives, if you have any, but I'm going to skip that here. Personally, I have my drives mounted to `~/plex/data` so keep that in mind when setting things up for yourself because hardlinks in the Radarr/Sonarr steps will only work on the same drive. More on that in that step.

Everything in this guide is in a folder located at `~/plex` on my machine, but it doesn't matter where you put these files. I'll try to use full path names where I can, but if I refer to the "root folder" at any point in this guide, it's `~/plex`.

Once your drives are mounted, create the media folders for Plex.

```bash
mkdir $PLEX/data/media
mkdir $PLEX/data/media/{movies,tv}
```

If you use Plex on its own, follow [their instructions](https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/) when organizing your media.

### Docker

To get Plex up and running, you'll want to start by creating your `docker-compose.yml` and `.env` at `~/plex/docker`.

```yaml
# docker-compose.yml
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
      - ${PLEX}/config:/config
      - ${PLEX}/data/media:/data/media
    restart: unless-stopped
```

The `restart: unless-stopped` line will ensure Plex restarts automatically on reboot if it stops unexpectedly. Be sure to enable to Docker service to get this to work, if you haven't already:

```bash
sudo systemctl enable docker.service
```

### Environment

The `.env` isn't strictly necessary just yet, but you'll be using these variables a lot, so I find it cleaner to keep them in a `.env`.

```bash
# .env
PLEX="/home/alex/plex"
PUID=1000
PGID=1000
TZ="America/Toronto"
```

## VPN (Private Internet Access)
