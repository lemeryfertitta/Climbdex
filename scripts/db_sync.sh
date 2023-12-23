for BOARD in decoy grasshopper kilter tension touchstone
do 
    mkdir -p data/$BOARD
    boardlib database $BOARD data/$BOARD/db.sqlite3
done