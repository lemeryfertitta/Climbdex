for BOARD in kilter tension
do 
    mkdir -p data/$BOARD
    gunzip data/$BOARD/db.sqlite3.gz || true
    boardlib database $BOARD data/$BOARD/db.sqlite3
    sqlite3 data/$BOARD/db.sqlite3 ".dump difficulty_grades holes layouts placement_roles placements product_sizes product_sizes_layouts_sets products products_angles sets" | sqlite3 data/$BOARD/metadata.sqlite3
    gzip -f data/$BOARD/*.sqlite3
done