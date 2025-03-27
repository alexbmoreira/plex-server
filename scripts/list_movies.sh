#!/bin/bash

# Usage:
#
# list_movies
#
# -s (Sort alphabetically)
# -t (List 'TV' directory)

SHOW_SIZE=true
DIR_PATH="$PLEX/data/media/movies"
SORT_CMD="sort -rh"

while getopts "st" opt; do
  case $opt in
    s)
      SHOW_SIZE=false
      SORT_CMD="sort"
      ;;
    t)
      DIR_PATH="$PLEX/data/media/tv"
      ;;
    \?)
      echo "Invalid option -$OPTARG" >&2
      exit 1
      ;;
  esac
done

cd $DIR_PATH

if $SHOW_SIZE; then
  du -sh * | $SORT_CMD | awk -F "\t" '$1 !~ /[0-3]K$/ { printf "%s\t%s\n", $1, $2 }'
  df -h | awk '$1=="/dev/sda" {print $4 " Available"}'
else
  for file in *; do
    echo "'$file'"
  done | $SORT_CMD
fi
