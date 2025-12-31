#!/bin/sh

INPUT_DIR="/watch"
OUTPUT_DIR="/output"

echo "Watching $INPUT_DIR for new epub files..."

inotifywait -m -e close_write -e moved_to --format '%w%f' "$INPUT_DIR" | while read filepath; do
    case "$filepath" in
        *.epub)
            filename=$(basename "$filepath")
            echo "Detected new file: $filename"

            sleep 2

            echo "Converting $filename..."
            kepubify -o "$OUTPUT_DIR" "$filepath"

            if [ $? -eq 0 ]; then
                echo "Conversion successful, removing original file"
                rm "$filepath"
            else
                echo "Conversion failed for $filename"
            fi
            ;;
    esac
done
