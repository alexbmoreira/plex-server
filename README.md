# Plex Server

A (close to) plug-and-play Plex setup using Docker that includes:

- **[Plex](https://www.plex.tv/)**
- **[Deluge](https://hub.docker.com/r/linuxserver/deluge)** as a download client
- **[ProtonVPN](https://protonvpn.com/)** for Deluge
- **[Prowlarr](https://wiki.servarr.com/en/prowlarr)** for indexing torrents
- **[Radarr](https://wiki.servarr.com/en/radarr)** for movies and **[Sonarr](https://wiki.servarr.com/en/sonarr)** for TV shows
- **[Overseerr](https://overseerr.dev/)** for adding movies and TV
- **[Kometa](https://kometa.wiki/en/latest/)** for managing Plex collections
- **[Bazarr](https://wiki.bazarr.media/)** for subtitles
- **[Cloudflare](https://www.cloudflare.com/en-ca/)** tunnels for remote access
- **[Tautilli](https://tautulli.com/)** for monitoring and notifications
- **[ErsatzTV](https://ersatztv.org/)** for live channels based on things in your library
- **[Wizarr](https://wizarr.org/docs/overview/introduction)** for onboarding new users to your Plex server
- My own **[Plex Home Theatre](https://github.com/alexbmoreira/plex-home-theatre)** for scheduling movies to be played at a selected time, plus printing tickets with seat numbers (_Work in Progress_).

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

**Network**
- Set incoming port to 6881 (otherwise Deluge will randomize it)

**Downloads**
- Set "Download to" as /data/torrents

**Plugins**
- Enable Label

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

## Radarr

Radarr manages your movie library. It monitors RSS feeds, connects to your indexers and torrent client, and handles downloads and sorting automatically.

Start by adding Radarr to Docker:

```yaml
  radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${HOME}/plex/radarr/data:/config
      - ${HOME}/plex/data:/data
    ports:
      - 7878:7878
    restart: unless-stopped
```

Once Radarr is up and running, access the web UI at port 7878 and change the folowing settings:

**Media Management**
- Add a root folder: /data/media/movies

**Profiles**
- Create a quality profile with the resolutions and formats you want
- Enable Upgrades Allowed to let Radarr replace lower-quality files with better ones

**Quality**
- Adjust quality settings to control file size by runtime
- Use [this guide](https://trash-guides.info/Radarr/Radarr-Quality-Settings-File-Size/#radarr-quality-definitions) as a reference

**Download Clients**
- Click “+”, choose Deluge
- Set Host to your server’s IP and enter your Deluge password
- Test and save the connection

**Connect**
- Click “+”, choose Plex Media Server
- Enter your server’s IP and sign in with Plex.tv

**Link to Prowlarr**
- Once Radarr is fully set up, go to **Settings** > **Apps** in Prowlarr and add it as an app.

## Overseerr

Overseerr provides a clean interface for finding and downloading movies and TV through Radarr and Sonarr. It also allows users to make requests movies if you plan on sharing your library.

Simply install Overseerr with Docker:

```yaml
  overseerr:
    image: sctx/overseerr:latest
    container_name: overseerr
    environment:
      - TZ="America/Toronto"
    ports:
      - 5055:5055
    volumes:
      - ${HOME}/plex/overseerr/data:/app/config
    restart: unless-stopped
```

Once running, open the app at port 5055 and complete the initial setup. To allow others to make requests, go to the Users tab and import your Plex users.

## Sonarr

Sonarr manages TV shows the same way Radarr handles movies. The setup and configuration steps are nearly identical.

```yaml
  sonarr:
    image: lscr.io/linuxserver/sonarr:latest
    container_name: sonarr
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
    volumes:
      - ${HOME}/plex/sonarr/data:/config
      - ${HOME}/plex/data:/data
    ports:
      - 8989:8989
    restart: unless-stopped
```

Once running, open the web UI at port 8989 and configure it just like Radarr:
- Add a root folder: /data/media/tv
- Set up quality profiles and preferred formats
- Connect Deluge as your download client
- Add your Plex server under Connect
- Link Sonarr to Prowlarr under Settings > Apps in Prowlarr

Check out the [Radarr section](#radarr) for detailed steps.

## Kometa

Kometa (formerly PMM) automates Plex metadata using YAML configs. You can use it to build collections, set posters and backgrounds, pull from IMDb or Letterboxd lists, and add movies to Radarr.

My config files are available in this repo, but I'd recommend starting from scratch and following the [Kometa docs](https://kometa.wiki/en/latest/) to build something that works for you.

Start by adding the following to your `.env`:

```bash
IP_ADDRESS="localserverip"
PLEX_TOKEN="yourtoken"
TMDB_API_KEY="tmdbkey"
RADARR_API_KEY="radarrkey"
```
> The Radarr API key is only needed if you want to integrate Kometa with Radarr.

Next, add the service to Docker:

```yaml
  kometa:
    image: kometateam/kometa:nightly
    container_name: kometa
    environment:
      - TZ=${TZ}
      - KOMETA_RUN=false
      - KOMETA_TIMES=00:00,02:00,06:30,17:00,19:00,20:00
      - KOMETA_CONFIG=/config/config.yml
      - KOMETA_IPADDRESS=${IP_ADDRESS}
      - KOMETA_PLEXTOKEN=${PLEX_TOKEN}
      - KOMETA_TMDBKEY=${TMDB_API_KEY}
      - KOMETA_RADARRKEY=${RADARR_API_KEY}
    volumes:
      - ${HOME}/plex/kometa/config:/config
    restart: unless-stopped
```
> Note: Environment variable names must not use underscores (PLEXTOKEN, not PLEX_TOKEN). It's weird, but underscores may prevent Kometa from reading them due to this [issue](https://github.com/Kometa-Team/Kometa/issues/2197#issuecomment-2476939655).

Before running Kometa, you’ll need to create your `~/plex/kometa/config` files. The docs explain this well, so I won’t go into detail here.

If you want to know what Kometa can do, here's some of what I use it for currently:

- Sort movies by a certain actor/director into their own collection, with a custom poster.
- Build seasonal collections (e.g. Halloween, Christmas), then auto-remove them after the season to keep my collections less cluttered.
- Create a collection in Plex that has all the movies that are in my Letterboxd watchlist.
- Pull new additions from my Letterboxd watchlist and send them to Radarr to be automatically downloaded.
