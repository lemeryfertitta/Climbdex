#!/bin/sh

for BOARD in decoy grasshopper kilter tension touchstone
do 
    bin/sync_db.sh $BOARD
done
fly deploy
