#!/bin/sh

mkdir -p data/$1
boardlib database $1 data/$1/db.sqlite3