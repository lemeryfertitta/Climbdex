for BOARD in kilter tension
do 
    mkdir -p data/$BOARD
    boardlib database $BOARD data/$BOARD/db.sqlite3
done