import flask
import sqlite3

QUERIES = {
    "angles": """
        SELECT angle
        FROM products_angles
        JOIN layouts
        ON layouts.product_id = products_angles.product_id
        WHERE layouts.id = $layout_id
        ORDER BY angle ASC""",
    "colors": """
        SELECT
            placement_roles.id,
            '#' || placement_roles.screen_color
        FROM placement_roles
        JOIN layouts
        ON layouts.product_id = placement_roles.product_id
        WHERE layouts.id = $layout_id""",
    "grades": """
        SELECT
            difficulty,
            boulder_name
        FROM difficulty_grades
        WHERE is_listed = 1
        ORDER BY difficulty ASC""",
    "holds": """
        SELECT 
            placements.id,
            holes.x,
            holes.y
        FROM placements
        INNER JOIN holes
        ON placements.hole_id=holes.id
        WHERE placements.layout_id = $layout_id
        AND placements.set_id = $set_id""",
    "layouts": """
        SELECT id, name
        FROM layouts
        WHERE is_listed=1
        AND password IS NULL""",
    "layout_name": """
        SELECT name
        FROM layouts
        WHERE id = $layout_id""",
    "image_filename": """
        SELECT 
            image_filename
        FROM product_sizes_layouts_sets
        WHERE layout_id = $layout_id
        AND product_size_id = $size_id
        AND set_id = $set_id""",
    "search": """
        SELECT 
            climbs.uuid,
            climbs.setter_username,
            climbs.name,
            climbs.description,
            climbs.frames,
            climb_stats.angle,
            climb_stats.ascensionist_count,
            (SELECT boulder_name FROM difficulty_grades WHERE difficulty = ROUND(climb_stats.display_difficulty)) AS difficulty,
            climb_stats.quality_average
        FROM climbs
        LEFT JOIN climb_stats
        ON climb_stats.climb_uuid = climbs.uuid
        INNER JOIN product_sizes
        ON product_sizes.id = $size_id
        WHERE climbs.frames_count = 1
        AND climbs.is_draft = 0
        AND climbs.is_listed = 1
        AND climbs.layout_id = $layout_id
        AND climbs.edge_left >= product_sizes.edge_left
        AND climbs.edge_right <= product_sizes.edge_right
        AND climbs.edge_bottom >= product_sizes.edge_bottom
        AND climbs.edge_top <= product_sizes.edge_top
        AND climb_stats.ascensionist_count >= $min_ascents
        AND climb_stats.display_difficulty BETWEEN $min_grade AND $max_grade
        AND climb_stats.quality_average >= $min_rating
        """,
    "sets": """
        SELECT
            sets.id,
            sets.name
        FROM sets
        INNER JOIN product_sizes_layouts_sets psls on sets.id = psls.set_id
        WHERE psls.product_size_id = $size_id
        AND psls.layout_id = $layout_id""",
    "size_name": """
        SELECT
            product_sizes.name
        FROM product_sizes
        INNER JOIN layouts
        ON product_sizes.product_id = layouts.product_id
        WHERE layouts.id = $layout_id
        AND product_sizes.id = $size_id""",
    "sizes": """
        SELECT 
            product_sizes.id,
            product_sizes.name,
            product_sizes.description
        FROM product_sizes
        INNER JOIN layouts
        ON product_sizes.product_id = layouts.product_id
        WHERE layouts.id = $layout_id""",
    "size_dimensions": """
        SELECT
            edge_left,
            edge_right,
            edge_bottom,
            edge_top
        FROM product_sizes
        WHERE id = $size_id""",
}


def get_board_database(board_name):
    try:
        return flask.g.database
    except AttributeError:
        flask.g.database = sqlite3.connect(f"data/{board_name}/db.sqlite3")
        return flask.g.database


def get_data(board_name, query_name, binds={}):
    database = get_board_database(board_name)
    cursor = database.cursor()
    cursor.execute(QUERIES[query_name], binds)
    return cursor.fetchall()


def get_search_count(args):
    base_sql, binds = get_search_base_sql_and_binds(args)
    database = get_board_database(args.get("board"))
    cursor = database.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM ({base_sql})", binds)
    return cursor.fetchall()[0][0]


def get_search_results(args):
    base_sql, binds = get_search_base_sql_and_binds(args)
    order_by_sql_name = {
        "ascents": "climb_stats.ascensionist_count",
        "difficulty": "climb_stats.display_difficulty",
        "name": "climbs.name",
        "quality": "climb_stats.quality_average",
    }[flask.request.args.get("sortBy")]
    sort_order = "ASC" if flask.request.args.get("sortOrder") == "asc" else "DESC"
    ordered_sql = f"{base_sql} ORDER BY {order_by_sql_name} {sort_order}"

    limited_sql = f"{ordered_sql} LIMIT $limit OFFSET $offset"
    binds["limit"] = int(flask.request.args.get("pageSize", 10))
    binds["offset"] = int(flask.request.args.get("page", 0)) * int(binds["limit"])

    database = get_board_database(flask.request.args.get("board"))
    cursor = database.cursor()
    results = cursor.execute(limited_sql, binds).fetchall()
    print(results)
    return results


def get_search_base_sql_and_binds(args):
    sql = QUERIES["search"]
    binds = {
        "layout_id": args.get("layout"),
        "size_id": args.get("size"),
        "min_ascents": args.get("minAscents"),
        "min_grade": args.get("minGrade"),
        "max_grade": args.get("maxGrade"),
        "min_rating": args.get("minRating"),
    }

    angle = args.get("angle")
    if angle and angle != "any":
        sql += " AND climb_stats.angle = $angle"
        binds["angle"] = angle

    holds = args.get("holds")
    if holds:
        sql += " AND climbs.frames LIKE $like_string"
        like_string_center = "%".join(
            sorted(
                f"p{hold_string}"
                for hold_string in holds.split("p")
                if len(hold_string) > 0
            )
        )
        like_string = f"%{like_string_center}%"
        binds["like_string"] = like_string

    return sql, binds
