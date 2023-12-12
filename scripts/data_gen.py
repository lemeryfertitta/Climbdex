import json
import logging
import pathlib
import sqlite3

import boardlib.db.aurora
import rjsmin

LOGGER = logging.getLogger(__name__)

CLIMB_SQL = """
SELECT 
    climbs.uuid,
    climbs.name,
    climbs.frames,
    climb_stats.angle,
    climb_stats.display_difficulty,
    climb_stats.ascensionist_count,
    climb_stats.quality_average
FROM climbs
LEFT JOIN climb_stats
ON climbs.uuid=climb_stats.climb_uuid
WHERE climbs.layout_id=1;
"""

HOLD_SQL = """
SELECT
    placements.id,
    holes.x,
    holes.y
FROM placements
INNER JOIN holes
ON placements.hole_id=holes.id
WHERE placements.layout_id=1
"""

ANGLE_SQL = """
SELECT angle
FROM products_angles
WHERE product_id=1
"""


def write_data_to_js(data, var_name, output_path):
    json_data = json.dumps(data)
    minified_js = rjsmin.jsmin(f"const {var_name} = {json_data}")
    pathlib.Path(output_path).parent.mkdir(exist_ok=True, parents=True)
    with open(output_path, "wt", encoding="utf-8") as output_file:
        output_file.write(minified_js)


def write_climb_data_to_js(db_path, output_path):
    LOGGER.info(f"Querying for climb data at {db_path}")
    climbs = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(CLIMB_SQL)
        for row in result:
            climb_data = climbs.get(row[0])
            if climb_data is None:
                climb_data = list(row[1:3])

            if row[3] is not None:
                climb_data.extend(row[3:7])

            climbs[row[0]] = climb_data

    LOGGER.info(f"Writing climb data to minified JS")
    write_data_to_js(climbs, "climbs", output_path)
    LOGGER.info(f"Successfully wrote data for {len(climbs)} climbs to {output_path}")


def write_hold_data_to_js(db_path, output_path):
    LOGGER.info(f"Querying for hold data at {db_path}")
    holds = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(HOLD_SQL)
        for row in result:
            holds[row[0]] = row[1:]

    LOGGER.info(f"Writing hold data to minified JS")
    write_data_to_js(holds, "holds", output_path)


def write_angle_data_to_js(db_path, output_path):
    LOGGER.info(f"Querying for angle data at {db_path}")
    angles = []
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(ANGLE_SQL)
        for row in result:
            angles.append(row[0])

    LOGGER.info(f"Writing angle data to minified JS")
    write_data_to_js(angles, "angles", output_path)


def main():
    db_path = pathlib.Path("tmp/kilter.sqlite3")
    db_path.parent.mkdir(exist_ok=True)

    if not db_path.exists():
        LOGGER.info(f"Downloading the database to {db_path}")
        boardlib.db.aurora.download_database("kilter", db_path)

    LOGGER.info(f"Syncing the database at {db_path}")
    boardlib.db.aurora.sync_shared_tables("kilter", db_path)

    write_climb_data_to_js(db_path, "src/data/climbs.js")
    write_hold_data_to_js(db_path, "src/data/holds.js")
    write_angle_data_to_js(db_path, "src/data/angles.js")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
