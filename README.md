# Plex Server

A (close to) plug-and-play Plex setup using Docker that includes:

- **[Plex](https://www.plex.tv/)**
- **[qBittorrent](https://www.qbittorrent.org/)** as a download client
- **[ProtonVPN](https://protonvpn.com/)** as a VPN through [Gluetun](https://github.com/qdm12/gluetun)
- **[Prowlarr](https://wiki.servarr.com/en/prowlarr)** for indexing torrents
- **[Radarr](https://wiki.servarr.com/en/radarr)** for movies and **[Sonarr](https://wiki.servarr.com/en/sonarr)** for TV shows
- **[Overseerr](https://overseerr.dev/)** for adding movies and TV
- **[Kometa](https://kometa.wiki/en/latest/)** for managing Plex collections
- **[Bazarr](https://wiki.bazarr.media/)** for subtitles
- **[Cloudflare](https://www.cloudflare.com/en-ca/)** tunnels for remote access
- **[Tautulli](https://tautulli.com/)** for monitoring and notifications
- **[ErsatzTV](https://ersatztv.org/)** for live channels based on things in your library
- **[Wizarr](https://wizarr.org/docs/overview/introduction)** for onboarding new users to your Plex server
- **[Arcane](https://getarcane.app/)** for managing Docker containers
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
    devices:
      - /dev/dri:/dev/dri
    restart: unless-stopped
```

The `/dev/dri` device is needed to allow for hardware transcoding with the iGPU. It may not be needed or may look different if you're using different hardware, but if you stuck with what I recommended above, you'll want to have that line.

If you're only running Plex and plan to add media manually, you can stop here. Just open Plex in your browser at port 32400 and set up your libraries to start watching.

## VPN (ProtonVPN)

There are a couple things to consider with your VPN setup. WireGuard vs. OpenVPN, port forwarding, etc. WireGuard is generally preferred for performance, but I've used OpenVPN with no issues before. Port forwarding will depend on your provider's capabilities, which is one of the reasons I picked ProtonVPN.

I have a WireGuard setup with port-forwarding through Gluetun. You can stick with OpenVPN if you need a different setup, but I recommend qBittorrent for easy port-forwarding. I'll cover it in more detail in that step.

Start by downloading a WireGuard config file from your VPN website. For ProtonVPN, go to the [downloads page](https://account.protonvpn.com/downloads) for your account, scroll down to WireGruard configuration, and choose the following options:

- **Platform**: GNU/Linux.
- **NetShield blocker filtering**: Block malware only. Blocking ads and trackers could break torrents.
- **Moderate NAT**: Off.
- **NAT-PMP**: On, this will allow port forwarding.
- **VPN Accelerator**: On. Just a performance boost.
- **Server**: Select any server in your preferred country. It's often best to pick something close to you. Make sure to select something with P2P (Peer-to-peer) enabled and with low traffic. Proton's recommendation will usually work best here.

Download the file provided and save it in `~/plex/vpn/config.toml`:

```toml
[Interface]
# Key for plex-server
# Bouncing = 23
# NetShield = 2
# Moderate NAT = off
# NAT-PMP (Port Forwarding) = on
# VPN Accelerator = on
PrivateKey = "oK7xV2M9fR8pL3nQ6wE1tY4uI0oP9aS8dF7gH5jK2lZ="
Address = "10.2.0.18/32"
DNS = "10.2.0.1"

[Peer]
# CA-TO#85
PublicKey = "mN8qR5tY2wE6rT9yU3iO1pA7sD4fG6hJ0kL5zX8cV9b="
AllowedIPs = [ "0.0.0.0/0", "::/0" ]
Endpoint = "192.99.15.44:51820"
```

Then add the private key to your `.env`. This part might not be required; I think Gluetun will work off the `config.toml` file regardless but I've never bothered to mess with my setup and confirm.

```bash
WIREGUARD_PRIVATE_KEY="yourprivatekey"
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
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - VPN_SERVICE_PROVIDER=protonvpn
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=${WIREGUARD_PRIVATE_KEY}
      - SERVER_COUNTRIES=Canada
      - VPN_PORT_FORWARDING=on
      - GLUETUN_HTTP_CONTROL_SERVER_ENABLE=on
    volumes:
      - ${PLEX}/vpn:/vpn
    restart: unless-stopped
```

## qBittorrent

I use qBittorrent with qSticky, which is an automated port forwarding manager for Gluetun and qBittorrent that will update the forwarded port in qBittorrent whenever it changes in your VPN. You can use any download client you like, but this setup is simplest, in my experience.

Start by adding qBittorrent to Docker:

```yaml
  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    container_name: qbittorrent
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - WEBUI_PORT=8080
    volumes:
      - ${PLEX}/qbittorrent/config:/config
      - ${PLEX}/data/torrents:/data/torrents
    network_mode: service:vpn
    depends_on:
      - vpn
    restart: unless-stopped
```

And expose qBittorrent's ports in your VPN service:

```yaml
  vpn:
    # ...
    ports:
      - 6881:6881
      - 6881:6881/udp
      - 8080:8080
```

Open the web UI at port 8080 and log in the temporary credentials printed in the logs, then change your username and password once logged in.

Go to **Tools** > **Options** > **Downloads**, and set the default save path to `/data/torrents`.

Next, set up your `.env` for qSticky:

```bash
QBITTORRENT_USER="yourusername"
QBITTORRENT_PASS="yourpassword"

GLUETUN_APIKEY="apikey"
```
> The api key can be created with a command like `openssl rand -hex 32`.

Then add the qSticky service to Docker:

```yaml
  qsticky:
    image: ghcr.io/monstermuffin/qsticky:latest
    container_name: qsticky
    environment:
      - QBITTORRENT_HOST=vpn
      - QBITTORRENT_HTTPS=false
      - QBITTORRENT_PORT=8080
      - QBITTORRENT_USER=${QBITTORRENT_USER}
      - QBITTORRENT_PASS=${QBITTORRENT_PASS}
      - GLUETUN_HOST=vpn
      - GLUETUN_AUTH_TYPE=apikey
      - GLUETUN_APIKEY=${GLUETUN_APIKEY}
      - LOG_LEVEL=INFO
    healthcheck:
      test: ["CMD", "python3", "-c", "import json; exit(0 if json.load(open('/app/health/status.json'))['healthy'] else 1)"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

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
- Click “+”, choose qBittorrent
- Set Host to your server’s IP and enter your qBittorrent login
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
- Connect qBittorrent as your download client
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

## Other tools

Some complementary tools I won't cover in full detail:

### Bazarr

Bazarr integrates with Radarr and Sonarr to automatically download and manage subtitles for your media. Setup is simple, and the app will automatically download, sort, and rename subtitle files for any movie or show you add to your collection.

### Cloudflare

Cloudflare tunnels are my choice for remote access. I use the [cloudflared docker image](https://hub.docker.com/r/cloudflare/cloudflared) and set up a tunnel for all my apps.

### Tautulli

Tautulli is an app used to monitor usage of your server. Who's streaming and when, whether or not your server is transcoding, etc. I also use it to notify me when new content is added to my library, so I never miss a release.

### ErsatzTV

ErsatzTV lets me create an IPTV server with my library. I don't use it a ton, but there are some really cool uses for it if you're willing to put in the setup work.

### Wizarr

Wizarr is used to invite people to your Plex library. It allows you to create a custom onboarding flow that walks new users through signing up for Plex, joining your library, and linking their account to Overseerr to request movies.

### Arcane

Arcane is used to monitor and manage Docker containers. With it I can check the status of everything I'm running and reboot remotely if necessary.
