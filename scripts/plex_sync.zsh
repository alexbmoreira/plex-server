#!/bin/zsh

dest="$PLEX_USER@$PLEX_IP:/home/$PLEX_USER/plex/"

while getopts ':r' arg; do
  case $arg in
    r)
      dest="$PLEX_USER@$REMOTE_PLEX_IP:/home/$PLEX_USER/plex"
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      return 1
      ;;
  esac
done

shift $((OPTIND -1))

rsync -avP -e ssh \
  --exclude='.git' \
  --exclude='*node_modules*' \
  --exclude='*__pycache__*' \
  --exclude='scripts/*.zsh' \
  /Users/$USER/plex/ $dest
