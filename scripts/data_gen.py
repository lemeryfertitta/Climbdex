import gzip
import json
import logging
import os
import pathlib
import sqlite3

import boardlib.api.aurora
import boardlib.db.aurora

LOGGER = logging.getLogger(__name__)

CLIMB_SQL = """
SELECT 
    products.id,
    climbs.layout_id,
    climbs.uuid,
    climbs.name,
    climbs.frames,
    climbs.edge_left,
    climbs.edge_right,
    climbs.edge_bottom,
    climbs.edge_top
FROM climbs
JOIN layouts ON climbs.layout_id=layouts.id
JOIN products ON layouts.product_id=products.id
WHERE climbs.frames_count=1
AND layouts.is_listed=1
AND layouts.password IS NULL;
"""

CLIMB_STATS_SQL = """
SELECT
    products.id,
    climbs.layout_id,
    climbs.uuid,
    climb_stats.angle,
    climb_stats.display_difficulty,
    climb_stats.ascensionist_count,
    climb_stats.quality_average
FROM climbs
LEFT JOIN climb_stats
ON climbs.uuid=climb_stats.climb_uuid
JOIN layouts ON climbs.layout_id=layouts.id
JOIN products ON layouts.product_id=products.id
WHERE climbs.frames_count=1
AND climb_stats.angle IS NOT NULL
AND layouts.is_listed=1
AND layouts.password IS NULL;
"""

HOLD_SQL = """
SELECT
    products.id,
    placements.layout_id,
    placements.id,
    holes.set_id,
    holes.x,
    holes.y
FROM placements
INNER JOIN holes
ON placements.hole_id=holes.id
JOIN layouts ON placements.layout_id=layouts.id
JOIN products ON layouts.product_id=products.id
WHERE layouts.is_listed=1
AND layouts.password IS NULL;
"""

ANGLE_SQL = """
SELECT 
    products_angles.product_id,
    products_angles.angle
FROM products_angles
JOIN products ON products_angles.product_id=products.id
JOIN layouts ON products.id=layouts.product_id
WHERE layouts.is_listed=1
AND layouts.password IS NULL;
"""

GRADE_SQL = """
SELECT difficulty, boulder_name
FROM difficulty_grades
WHERE is_listed=1
"""

PRODUCT_SQL = """
SELECT
    product_sizes_layouts_sets.product_size_id,
    product_sizes.product_id,
    product_sizes.name,
    product_sizes.edge_left,
    product_sizes.edge_right,
    product_sizes.edge_bottom,
    product_sizes.edge_top,
    product_sizes_layouts_sets.layout_id,
    layouts.name,
    product_sizes_layouts_sets.image_filename
FROM product_sizes
JOIN product_sizes_layouts_sets
ON product_sizes.id=product_sizes_layouts_sets.product_size_id
JOIN layouts ON product_sizes_layouts_sets.layout_id=layouts.id
WHERE layouts.is_listed=1
AND layouts.password IS NULL;
"""

PRODUCT_IMAGE_SQL = """
SELECT 
    product_sizes_layouts_sets.product_size_id,
    product_sizes_layouts_sets.image_filename
FROM product_sizes_layouts_sets
JOIN product_sizes
ON product_sizes.id=product_sizes_layouts_sets.product_size_id
JOIN layouts ON product_sizes_layouts_sets.layout_id=layouts.id
WHERE layouts.is_listed=1
AND layouts.password IS NULL;
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
            layout_key = (row[0], row[1])
            layout_climbs = climbs.get(layout_key, {})
            layout_climbs[row[2]] = row[3:]
            climbs[layout_key] = layout_climbs

    LOGGER.info(f"Writing climb data to compressed JSON")
    for (product_id, layout_id), climbs in climbs.items():
        layout_path = pathlib.Path(output_path).joinpath(
            f"product_{product_id}/layout_{layout_id}/climbs.json.gz"
        )
        layout_path.parent.mkdir(exist_ok=True, parents=True)
        write_data(climbs, layout_path)


def write_climb_stats(db_path, output_path):
    LOGGER.info(f"Querying for climb stats data at {db_path}")
    layout_climb_stats = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(CLIMB_STATS_SQL)
        for row in result:
            layout_key = (row[0], row[1])
            climb_stats = layout_climb_stats.get(layout_key, {})
            angle_stats = climb_stats.get(row[2], {})
            angle_stats[row[3]] = row[4:]
            climb_stats[row[2]] = angle_stats
            layout_climb_stats[layout_key] = climb_stats

    LOGGER.info(f"Writing climb stats data to compressed JSON")
    for (product_id, layout_id), climb_stats in layout_climb_stats.items():
        layout_path = pathlib.Path(output_path).joinpath(
            f"product_{product_id}/layout_{layout_id}/climbStats.json.gz"
        )
        layout_path.parent.mkdir(exist_ok=True, parents=True)
        write_data(climb_stats, layout_path)


def write_holds(db_path, output_path):
    LOGGER.info(f"Querying for hold data at {db_path}")
    layout_holds = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(HOLD_SQL)
        for row in result:
            layout_key = (row[0], row[1])
            holds = layout_holds.get(layout_key, {})
            holds[row[2]] = row[3:]
            layout_holds[layout_key] = holds

    LOGGER.info(f"Writing hold data to compressed JSON")
    for (product_id, layout_id), holds in layout_holds.items():
        layout_path = pathlib.Path(output_path).joinpath(
            f"product_{product_id}/layout_{layout_id}/holds.json.gz"
        )
        layout_path.parent.mkdir(exist_ok=True, parents=True)
        write_data(holds, layout_path)


def write_angles(db_path, output_path):
    LOGGER.info(f"Querying for angle data at {db_path}")
    product_angles = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(ANGLE_SQL)
        for row in result:
            angles = product_angles.get(row[0], [])
            angles.append(row[0])
            product_angles[row[0]] = angles

    LOGGER.info(f"Writing angle data to compressed JSON")
    for product_id, angles in product_angles.items():
        product_path = pathlib.Path(output_path).joinpath(
            f"product_{product_id}/angles.json.gz"
        )
        product_path.parent.mkdir(exist_ok=True, parents=True)
        write_data(angles, product_path)


def write_grades(db_path, output_path):
    LOGGER.info(f"Querying for grade data at {db_path}")
    grades = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(GRADE_SQL)
        for row in result:
            grades[row[0]] = row[1]

    LOGGER.info(f"Writing grade data to compressed JSON")
    grade_path = pathlib.Path(output_path).joinpath(f"grades.json.gz")
    grade_path.parent.mkdir(exist_ok=True, parents=True)
    write_data(grades, grade_path)


def write_products(db_path, output_path):
    LOGGER.info(f"Querying for product data at {db_path}")
    product_sizes = {}
    with sqlite3.connect(db_path) as connection:
        result = connection.execute(PRODUCT_SQL)
        for row in result:
            product_size = product_sizes.get(
                row[0],
                {
                    "productId": row[1],
                    "productSizeName": row[2],
                    "edgeLeft": row[3],
                    "edgeRight": row[4],
                    "edgeBottom": row[5],
                    "edgeTop": row[6],
                    "layoutId": row[7],
                    "layoutName": row[8],
                    "imageFilenames": [],
                },
            )
            product_size["imageFilenames"].append(pathlib.PurePath(row[9]).name)
            product_sizes[row[0]] = product_size

    LOGGER.info(f"Writing product data to compressed JSON")
    product_sizes_path = pathlib.Path(output_path).joinpath(f"productSizes.json.gz")
    product_sizes_path.parent.mkdir(exist_ok=True, parents=True)
    write_data(product_sizes, product_sizes_path)


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
        for image_filename in image_filenames:
            output_path = image_dir_path.joinpath(
                f"product_size_{product_size_id}/{pathlib.PurePath(image_filename).name}"
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

    # write_climbs(db_path, "data")
    # write_climb_stats(db_path, "data")
    # write_holds(db_path, "data")
    # write_angles(db_path, "data")
    # write_grades(db_path, "data")
    write_products(db_path, "data")
    download_product_images(db_path, pathlib.Path("media"))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
