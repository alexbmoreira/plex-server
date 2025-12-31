FROM alpine:latest

RUN apk add --no-cache curl inotify-tools \
    && curl -L "https://github.com/pgaskin/kepubify/releases/download/v4.0.4/kepubify-linux-64bit" -o /usr/local/bin/kepubify \
    && chmod +x /usr/local/bin/kepubify \
    && apk del curl

WORKDIR /watch

ENTRYPOINT ["/usr/local/bin/watch.sh"]
