import flask
import sqlite3

app = flask.Flask(__name__)

DATABASE = "tmp/kilter.sqlite3"

ANGLES_SQL = """
SELECT
  angle
FROM products_angles
JOIN layouts
ON layouts.product_id = products_angles.product_id
WHERE layouts.id = $layout_id
ORDER BY angle ASC
"""

COLORS_SQL = """
SELECT 
    placement_roles.id,
    '#' || placement_roles.screen_color
FROM placement_roles
JOIN layouts
ON layouts.product_id = placement_roles.product_id
WHERE layouts.id = $layout_id;
"""

GRADES_SQL = """
SELECT
  difficulty,
  boulder_name
FROM difficulty_grades
WHERE is_listed = 1
ORDER BY difficulty ASC
"""

HOLDS_SQL = """
SELECT 
    placements.id,
    holes.x,
    holes.y
FROM placements
INNER JOIN holes
ON placements.hole_id=holes.id
WHERE placements.layout_id = $layout_id
AND placements.set_id = $set_id
"""

LAYOUTS_SQL = """
SELECT id, name
FROM layouts
WHERE is_listed=1
AND password IS NULL;
"""

IMAGE_FILENAME_SQL = """
SELECT 
    image_filename
FROM product_sizes_layouts_sets
WHERE layout_id = $layout_id
AND product_size_id = $size_id
AND set_id = $set_id
"""

SEARCH_SQL = """
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

-- BASIC FILTERS:
WHERE climbs.frames_count = 1
AND climbs.is_draft = 0
AND climbs.is_listed = 1

-- LAYOUT
AND climbs.layout_id = $layout_id

-- PRODUCT SIZE:
AND climbs.edge_left >= product_sizes.edge_left
AND climbs.edge_right <= product_sizes.edge_right
AND climbs.edge_bottom >= product_sizes.edge_bottom
AND climbs.edge_top <= product_sizes.edge_top

-- ASCENTS:
AND climb_stats.ascensionist_count >= $min_ascents

-- GRADES:
AND climb_stats.display_difficulty BETWEEN $min_grade AND $max_grade

-- RATING:
AND climb_stats.quality_average >= $min_rating
"""

SETS_SQL = """
SELECT 
    sets.id,
    sets.name
FROM sets
INNER JOIN product_sizes_layouts_sets psls on sets.id = psls.set_id
WHERE psls.product_size_id = $size_id
AND psls.layout_id = $layout_id
"""

SIZES_SQL = """
SELECT 
    product_sizes.id,
    product_sizes.name,
    product_sizes.description
FROM product_sizes
INNER JOIN layouts
ON product_sizes.product_id = layouts.product_id
WHERE layouts.id = $layout_id
"""

SIZE_DIMENSIONS_SQL = """
SELECT
    edge_left,
    edge_right,
    edge_bottom,
    edge_top
FROM product_sizes
WHERE id = $size_id
"""


def get_db():
    db = getattr(flask.g, "_database", None)
    if db is None:
        db = flask.g._database = sqlite3.connect(DATABASE)
    return db


@app.route("/api/v1/layouts")
def layouts():
    database = get_db()
    cursor = database.cursor()
    cursor.execute(LAYOUTS_SQL)
    return flask.jsonify(cursor.fetchall())


@app.route("/api/v1/layouts/<layout_id>/sizes")
def sizes(layout_id):
    database = get_db()
    cursor = database.cursor()
    cursor.execute(SIZES_SQL, {"layout_id": layout_id})
    return flask.jsonify(cursor.fetchall())


@app.route("/api/v1/layouts/<layout_id>/sizes/<size_id>/sets")
def sets(layout_id, size_id):
    database = get_db()
    cursor = database.cursor()
    cursor.execute(SETS_SQL, {"layout_id": layout_id, "size_id": size_id})
    return flask.jsonify(cursor.fetchall())


@app.route("/api/v1/search")
def search():
    sql = SEARCH_SQL
    binds = {
        "layout_id": flask.request.args.get("layout"),
        "size_id": flask.request.args.get("size"),
        "min_ascents": flask.request.args.get("minAscents"),
        "min_grade": flask.request.args.get("minGrade"),
        "max_grade": flask.request.args.get("maxGrade"),
        "min_rating": flask.request.args.get("minRating"),
    }

    angle = flask.request.args.get("angle")
    if angle and angle != "any":
        sql += " AND climb_stats.angle = $angle"
        binds["angle"] = angle

    holds = flask.request.args.get("holds")
    if holds:
        sql += " AND climbs.frames LIKE $like_string"
        like_string_center = sorted(
            f"p{hold_string}"
            for hold_string in holds.split("p")
            if hold_string.length > 0
        ).join("%")
        like_string = f"%{like_string_center}%"
        binds["like_string"] = like_string

    order_by_sql_name = {
        "ascents": "climb_stats.ascensionist_count",
        "grade": "climb_stats.display_difficulty",
        "name": "climbs.name",
        "rating": "climb_stats.quality_average",
    }[flask.request.args.get("sortBy")]
    sort_order = "ASC" if flask.request.args.get("sortOrder") == "asc" else "DESC"
    sql += f" ORDER BY {order_by_sql_name} {sort_order}"
    sql += " LIMIT $limit OFFSET $offset"
    binds["limit"] = int(flask.request.args.get("pageSize", 10))
    binds["offset"] = int(flask.request.args.get("page", 0)) * int(binds["limit"])
    database = get_db()
    cursor = database.cursor()
    cursor.connection.set_trace_callback(print)
    cursor.execute(sql, binds)
    results = cursor.fetchall()
    return flask.jsonify(results)


@app.route("/")
def index():
    return flask.render_template(
        "boardSelection.html.j2",
    )


@app.route("/filter")
def filter():
    board_name = flask.request.args.get("board")
    layout_id = flask.request.args.get("layout")
    size_id = flask.request.args.get("size")
    set_ids = flask.request.args.getlist("set")
    database = get_db()
    cursor = database.cursor()
    cursor.execute(ANGLES_SQL, {"layout_id": layout_id})
    angles = cursor.fetchall()
    cursor.execute(GRADES_SQL)
    grades = cursor.fetchall()
    cursor.execute(COLORS_SQL, {"layout_id": layout_id})
    colors = cursor.fetchall()

    return flask.render_template(
        "filterSelection.html.j2",
        params=flask.request.args,
        angles=angles,
        grades=grades,
        colors=colors,
        **get_draw_board_args(cursor, layout_id, size_id, set_ids),
    )


@app.route("/results")
def results():
    board_name = flask.request.args.get("board")
    layout_id = flask.request.args.get("layout")
    size_id = flask.request.args.get("size")
    set_ids = flask.request.args.getlist("set")
    database = get_db()
    cursor = database.cursor()
    cursor.execute(COLORS_SQL, {"layout_id": layout_id})
    colors = cursor.fetchall()
    return flask.render_template(
        "results.html.j2",
        colors=colors,
        **get_draw_board_args(
            cursor,
            layout_id,
            size_id,
            set_ids,
        ),
    )


def get_draw_board_args(cursor, layout_id, size_id, set_ids):
    images_to_holds = {}
    for set_id in set_ids:
        cursor.execute(
            IMAGE_FILENAME_SQL,
            {"layout_id": layout_id, "size_id": size_id, "set_id": set_id},
        )
        image_filename = f"http://api.kilterboardapp.com/img/{cursor.fetchone()[0]}"
        cursor.execute(HOLDS_SQL, {"layout_id": layout_id, "set_id": set_id})
        holds = cursor.fetchall()
        images_to_holds[image_filename] = holds

    cursor.execute(SIZE_DIMENSIONS_SQL, {"size_id": size_id})
    size_dimensions = cursor.fetchone()
    return {
        "images_to_holds": images_to_holds,
        "edge_left": size_dimensions[0],
        "edge_right": size_dimensions[1],
        "edge_bottom": size_dimensions[2],
        "edge_top": size_dimensions[3],
    }
