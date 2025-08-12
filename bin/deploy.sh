#!/bin/sh

for BOARD in decoy grasshopper kilter tension touchstone
do 
    echo "Syncing database for $BOARD with user $1"
    bin/sync_db.sh $BOARD $1
    echo "Downloading images for $BOARD"
    boardlib images $BOARD data/$BOARD/db.sqlite data/$BOARD/images
done
fly deploy
