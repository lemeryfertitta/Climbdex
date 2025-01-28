#!/bin/sh

for BOARD in decoy grasshopper kilter soill tension touchstone
do 
    bin/sync_db.sh $BOARD
done
fly deploy
