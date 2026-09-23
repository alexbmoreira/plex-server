#!/bin/bash
# Restarts the vpn/qbittorrent/qsticky stack if gluetun's forwarded port is missing.
# Gluetun's internal port-forwarding loop has been silently dying every 4-9 days
# without logging an error or restarting the container, leaving qBittorrent
# "Firewalled" until the vpn container is restarted. Run via cron every 3 days.

set -u

LOG_TAG="check-vpn-portforward"
COMPOSE_DIR="/home/alex/plex/docker"

log() {
    logger -t "$LOG_TAG" "$1"
}

MAX_ATTEMPTS=5

if docker exec vpn test -s /tmp/gluetun/forwarded_port 2>/dev/null; then
    port=$(docker exec vpn cat /tmp/gluetun/forwarded_port)
    log "OK: forwarded port present ($port), no action needed"
    exit 0
fi

log "forwarded_port file missing or empty - restarting vpn stack"
cd "$COMPOSE_DIR" || { log "ERROR: cannot cd to $COMPOSE_DIR"; exit 1; }

success=0
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    docker compose restart vpn
    sleep 20

    if docker exec vpn test -s /tmp/gluetun/forwarded_port 2>/dev/null; then
        port=$(docker exec vpn cat /tmp/gluetun/forwarded_port)
        log "vpn restart succeeded on attempt $attempt, port forwarded: $port"
        success=1
        break
    else
        log "attempt $attempt/$MAX_ATTEMPTS: still no forwarded port (server likely has broken NAT-PMP), retrying"
    fi
done

if [ "$success" -eq 0 ]; then
    log "ERROR: no forwarded port after $MAX_ATTEMPTS attempts, giving up - manual check needed"
    exit 1
fi

docker compose restart qbittorrent qsticky
log "restarted qbittorrent and qsticky to pick up new port"
