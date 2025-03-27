#!/bin/zsh

while getopts ':mt' arg; do
  case $arg in
    m)
      media_type="movies"
      ;;
    t)
      media_type="tv"
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      return 1
      ;;
  esac
done

if [ $OPTIND -eq 1 ]; then
  echo "No options were passed" 1>&2
  return 1
fi

shift $((OPTIND -1))

target="/home/$PLEX_USER/plex/data/media/$media_type/"

echo rsync -avP $@ $PLEX_USER@$PLEX_IP:$target

if [[ $? -eq 0 ]]; then
  echo "Files transferred successfully."
else
  echo "There was an error transferring files."
  return 1
fi
