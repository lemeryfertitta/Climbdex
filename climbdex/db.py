import boardlib
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
    "beta": """
        SELECT
            angle,
            foreign_username,
            link
        FROM beta_links
        WHERE climb_uuid = $uuid
        AND is_listed = 1
        AND link like 'https://www.instagram.com%'
        ORDER BY angle DESC""",
    "climb": """
        SELECT name
        FROM climbs
        WHERE uuid = $uuid""",
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
            mirrored_placements.id,
            holes.x,
            holes.y
        FROM holes
        INNER JOIN placements
        ON placements.hole_id=holes.id
        AND placements.set_id = $set_id
        AND placements.layout_id = $layout_id
        LEFT JOIN placements mirrored_placements
        ON mirrored_placements.hole_id = holes.mirrored_hole_id
        AND mirrored_placements.set_id = $set_id
        AND mirrored_placements.layout_id = $layout_id""",
    "layouts": """
        SELECT id, name
        FROM layouts
        WHERE is_listed=1
        AND password IS NULL""",
    "layout_is_mirrored": """
        SELECT is_mirrored
        FROM layouts
        WHERE id = $layout_id""",
    "layout_name": """
        SELECT name
        FROM layouts
        WHERE id = $layout_id""",
    "leds": """
        SELECT 
            placements.id,
            leds.position
        FROM placements
        INNER JOIN leds ON placements.hole_id = leds.hole_id
        WHERE placements.layout_id = $layout_id
        AND leds.product_size_id = $size_id""",
    "led_colors": """
        SELECT
            placement_roles.id,
            placement_roles.led_color
        FROM placement_roles
        JOIN layouts
        ON layouts.product_id = placement_roles.product_id
        WHERE layouts.id = $layout_id""",
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
            climb_stats.quality_average,
            (SELECT ROUND(climb_stats.difficulty_average - ROUND(climb_stats.display_difficulty), 2)) AS difficulty_error
        FROM climbs
        LEFT JOIN climb_stats
        ON climb_stats.climb_uuid = climbs.uuid
        INNER JOIN product_sizes
        ON product_sizes.id = $size_id
        WHERE climbs.frames_count = 1
        AND climbs.is_draft = 0
        AND climbs.is_listed = 1
        AND climbs.layout_id = $layout_id
        AND climbs.edge_left > product_sizes.edge_left
        AND climbs.edge_right < product_sizes.edge_right
        AND climbs.edge_bottom > product_sizes.edge_bottom
        AND climbs.edge_top < product_sizes.edge_top
        AND climb_stats.ascensionist_count >= $min_ascents
        AND ROUND(climb_stats.display_difficulty) BETWEEN $min_grade AND $max_grade
        AND climb_stats.quality_average >= $min_rating
        AND ABS(ROUND(climb_stats.display_difficulty) - climb_stats.difficulty_average) <= $grade_accuracy
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
    }[args.get("sortBy")]
    sort_order = "ASC" if args.get("sortOrder") == "asc" else "DESC"
    ordered_sql = f"{base_sql} ORDER BY {order_by_sql_name} {sort_order}"

    limited_sql = f"{ordered_sql} LIMIT $limit OFFSET $offset"
    binds["limit"] = int(args.get("pageSize", 10))
    binds["offset"] = int(args.get("page", 0)) * int(binds["limit"])

    database = get_board_database(args.get("board"))
    cursor = database.cursor()
    cursor.execute(limited_sql, binds)
    return cursor.fetchall()


def get_search_base_sql_and_binds(args):
    sql = QUERIES["search"]
    binds = {
        "layout_id": int(args.get("layout")),
        "size_id": int(args.get("size")),
        "min_ascents": int(args.get("minAscents")),
        "min_grade": int(args.get("minGrade")),
        "max_grade": int(args.get("maxGrade")),
        "min_rating": float(args.get("minRating")),
        "grade_accuracy": float(args.get("gradeAccuracy")),
    }

    name = args.get("name")
    if name:
        sql += " AND climbs.name LIKE :name"
        binds["name"] = f"%{name}%"

    settername = args.get("settername")
    if settername:
        sql += " AND setter_username LIKE :settername"
        binds["settername"] = f"%{settername}%"

    angle = args.get("angle")
    if angle and angle != "any":
        sql += " AND climb_stats.angle = $angle"
        binds["angle"] = int(angle)

    holds = args.get("holds")
    match_roles = args.get("roleMatch") == "strict"
    if holds:
        sql += " AND (climbs.frames LIKE $like_string"
        binds["like_string"] = get_frames_like_clause(holds, match_roles)
        mirrored_holds = args.get("mirroredHolds")
        if mirrored_holds and layout_is_mirrored(args.get("board"), args.get("layout")):
            sql += " OR climbs.frames LIKE $mirrored_like_string"
            binds["mirrored_like_string"] = get_frames_like_clause(
                mirrored_holds, match_roles
            )
        sql += " )"
    
    maxHolds = args.get("maxHoldNumber")
    minHolds = args.get("minHoldNumber")
    if maxHolds or minHolds:
        sql += " AND ((length(frames) - length(replace(frames, 'r' || (SELECT placement_roles.id FROM placement_roles JOIN layouts on layouts.product_id = placement_roles.product_id WHERE layouts.id = $layout_id AND placement_roles.position = '2'), ''))) / (length((SELECT placement_roles.id FROM placement_roles JOIN layouts on layouts.product_id = placement_roles.product_id WHERE layouts.id = $layout_id AND placement_roles.position = '2')) + 1))"
    if maxHolds and minHolds:
        sql += " BETWEEN $minHolds and $maxHolds"
        binds['maxHolds'] = int(maxHolds)
        binds['minHolds'] = int(minHolds)
    elif maxHolds:
        sql += " <= $maxHolds"
        binds['maxHolds'] = int(maxHolds)
    elif minHolds:
        sql += " >= $minHolds"
        binds['minHolds'] = int(minHolds)

    return sql, binds


def iterframes(frames):
    for frame in frames.split("p")[1:]:
        placement, role = frame.split("r")
        yield int(placement), int(role)


def get_frames_like_clause(holds, match_roles):
    like_string_center = "%".join(
        f"p{placement}r{role if match_roles else ''}"
        for placement, role in sorted(iterframes(holds), key=lambda frame: frame[0])
    )
    return f"%{like_string_center}%"


def layout_is_mirrored(board, layout_id):
    return get_data(board, "layout_is_mirrored", {"layout_id": layout_id})[0][0] == 1
