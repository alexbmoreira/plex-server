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

## VPN (ProtonVPN)

There are a few things to consider with VPN setup — port forwarding, WireGuard vs OpenVPN, etc. I won’t get into all of it because, frankly, I don’t fully understand it all myself. I use ProtonVPN with OpenVPN, and it works well for me.

WireGuard is generally preferred for performance, but I only get a few KB/s with it for some reason and need to figure that out, so I stick with OpenVPN in the meantime. Use whatever works best for you.

Add your OpenVPN credentials to your `.env`:

```bash
OPENVPN_USERNAME="yourusername"
OPENVPN_PASSWORD="yourpassword"
```

Then add Gluetun to your `docker-compose.yml`:

```yaml
  vpn:
    image: qmcgaw/gluetun
    container_name: vpn
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun
    environment:
      - VPN_SERVICE_PROVIDER=protonvpn
      - VPN_TYPE=openvpn
      - OPENVPN_USER=${OPENVPN_USERNAME}
      - OPENVPN_PASSWORD=${OPENVPN_PASSWORD}
      - SERVER_COUNTRIES=Canada
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${HOME}/plex/vpn:/vpn
    restart: unless-stopped
```

## Deluge

Most setup happens within the browser UI itself. You can use any torrent client you like, they'll probably all be relatively similar in terms of setup.

Start by adding the directory for your torrents. Make sure this is on the same physical drive as your movies and shows (In this case, `~/plex/data`) in order for hardlinking to work with Radarr and Sonarr.

```bash
mkdir -p ~/plex/data/torrents
```

Add the Deluge service to Docker:

```yaml
  deluge:
    image: lscr.io/linuxserver/deluge:latest
    container_name: deluge
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${HOME}/plex/deluge/config:/config
      - ${HOME}/plex/data/torrents:/data/torrents
    network_mode: service:vpn
    depends_on:
      - vpn
    restart: unless-stopped
```

Then expose Deluge’s ports in your VPN service:

```yaml
  vpn:
    # ...
    ports:
      - 8112:8112
      - 6881:6881
      - 6881:6881/udp
```

Open the web UI at port 8112 and log in with:
```
Username: admin
Password: deluge
```

Change the password, then go to Preferences and update the following:

**Network:** Set incoming port to 6881 (otherwise Deluge will randomize it)

**Downloads**: Set "Download to" as /data/torrents

**Plugins:** Enable Label

We'll revisit Deluge settings later as we add Radarr and Sonarr.

## Prowlarr

Prowlarr is used to manage torrent trackers for Radarr and Sonarr.

Add Prowlarr to your `docker-compose.yml`:

```yaml
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${HOME}/plex/prowlarr/data:/config
    ports:
      - 9696:9696
    restart: unless-stopped
```

Once it's running, open the web UI at port 9696 and start adding your preferred torrent sites under Indexers.

There's nothing else to set up here until Radarr and Sonarr are running. Once those are set up, they can be linked through **Settings** > **Apps** in Prowlarr.

