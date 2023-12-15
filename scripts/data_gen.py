import gzip
import json
import logging
import pathlib
import sqlite3

import boardlib.api.aurora
import boardlib.db.aurora
import rjsmin

LOGGER = logging.getLogger(__name__)

CLIMB_SQL = """
SELECT 
    climbs.uuid,
    climbs.name,
    climbs.frames,
    climbs.edge_left,
    climbs.edge_right,
    climbs.edge_bottom,
    climbs.edge_top
FROM climbs
WHERE climbs.layout_id=1
AND climbs.frames_count=1;
"""

CLIMB_STATS_SQL = """
SELECT
    climbs.uuid,
    climb_stats.angle,
    climb_stats.display_difficulty,
    climb_stats.ascensionist_count,
    climb_stats.quality_average
FROM climbs
LEFT JOIN climb_stats
ON climbs.uuid=climb_stats.climb_uuid
WHERE climbs.layout_id=1
AND climbs.frames_count=1
AND climb_stats.angle IS NOT NULL;
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

GRADE_SQL = """
SELECT difficulty, boulder_name
FROM difficulty_grades
WHERE is_listed=1
"""

PRODUCT_SQL = """
SELECT 
    product_sizes_layouts_sets.product_size_id,
    product_sizes.name,
    product_sizes.edge_left,
    product_sizes.edge_right,
    product_sizes.edge_bottom,
    product_sizes.edge_top
FROM product_sizes
JOIN product_sizes_layouts_sets
ON product_sizes.id=product_sizes_layouts_sets.product_size_id
WHERE product_id=1;
"""

PRODUCT_IMAGE_SQL = """
SELECT product_sizes_layouts_sets.product_size_id, product_sizes_layouts_sets.image_filename
FROM product_sizes_layouts_sets
JOIN product_sizes
ON product_sizes.id=product_sizes_layouts_sets.product_size_id
WHERE product_id=1;
"""


def write_data(data, output_path):
    with gzip.open(output_path, "wt", encoding="utf-8") as output_file:
        output_file.write(json.dumps(data))


def write_climbs(db_path, output_path):
    LOGGER.info(f"Querying for climb data at {db_path}")
    climbs = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(CLIMB_SQL)
        for row in result:
            climbs[row[0]] = row[1:]

    LOGGER.info(f"Writing climb data to compressed JSON")
    write_data(climbs, output_path)


def write_climb_stats(db_path, output_path):
    LOGGER.info(f"Querying for climb stats data at {db_path}")
    climb_stats = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(CLIMB_STATS_SQL)
        for row in result:
            stats = climb_stats.get(row[0], {})
            stats[row[1]] = row[2:]
            climb_stats[row[0]] = stats

    LOGGER.info(f"Writing climb stats data to compressed JSON")
    write_data(climb_stats, output_path)


def write_holds(db_path, output_path):
    LOGGER.info(f"Querying for hold data at {db_path}")
    holds = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(HOLD_SQL)
        for row in result:
            holds[row[0]] = row[1:]

    LOGGER.info(f"Writing hold data to compressed JSON")
    write_data(holds, output_path)


def write_angles(db_path, output_path):
    LOGGER.info(f"Querying for angle data at {db_path}")
    angles = []
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(ANGLE_SQL)
        for row in result:
            angles.append(row[0])

    LOGGER.info(f"Writing angle data to compressed JSON")
    write_data(angles, output_path)


def write_grades(db_path, output_path):
    LOGGER.info(f"Querying for grade data at {db_path}")
    grades = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(GRADE_SQL)
        for row in result:
            grades[row[0]] = row[1]

    LOGGER.info(f"Writing grade data to compressed JSON")
    write_data(grades, output_path)


def write_products(db_path, output_path):
    LOGGER.info(f"Querying for product data at {db_path}")
    products = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(PRODUCT_SQL)
        for row in result:
            products[row[0]] = {
                "name": row[1],
                "edge_left": row[2],
                "edge_right": row[3],
                "edge_bottom": row[4],
                "edge_top": row[5],
            }

    LOGGER.info(f"Writing product data to compressed JSON")
    write_data(products, output_path)


def download_product_images(db_path, image_dir_path):
    LOGGER.info(f"Querying for product image data at {db_path}")
    product_size_images = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(PRODUCT_IMAGE_SQL)
        for row in result:
            image_filenames = product_size_images.get(row[0], [])
            image_filenames.append(row[1])
            product_size_images[row[0]] = image_filenames

    LOGGER.info(f"Downloading product images to {image_dir_path}")
    for product_size_id, image_filenames in product_size_images.items():
        for image_index, image_filename in enumerate(image_filenames):
            output_path = image_dir_path.joinpath(
                f"{product_size_id}/{image_index}.png"
            )
            output_path.parent.mkdir(exist_ok=True, parents=True)
            if output_path.exists():
                LOGGER.info(f"Skipping {image_filename} as it already exists")
            else:
                LOGGER.info(f"Downloading {image_filename} to {output_path}")
                boardlib.api.aurora.download_image(
                    "kilter",
                    image_filename,
                    output_path,
                )


def main():
    db_path = pathlib.Path("tmp/kilter.sqlite3")
    db_path.parent.mkdir(exist_ok=True)

    if not db_path.exists():
        LOGGER.info(f"Downloading the database to {db_path}")
        boardlib.db.aurora.download_database("kilter", db_path)

    LOGGER.info(f"Syncing the database at {db_path}")
    boardlib.db.aurora.sync_shared_tables("kilter", db_path)

    write_climbs(db_path, "data/climbs.json.gz")
    write_climb_stats(db_path, "data/climbStats.json.gz")
    write_holds(db_path, "data/holds.json.gz")
    write_angles(db_path, "data/angles.json.gz")
    write_grades(db_path, "data/grades.json.gz")
    write_products(db_path, "data/products.json.gz")
    download_product_images(db_path, pathlib.Path("media"))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
