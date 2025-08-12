#!/bin/sh

mkdir -p data/$1
echo "Syncing database for $1 with user $2"
boardlib database $1 data/$1/db.sqlite -u $2