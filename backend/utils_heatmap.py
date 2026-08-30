from math import floor
from collections import Counter

from database import Image

# Logic for building the heatmap data lives here

def create_density_bins(images: list[Image], resolution=0.1) -> list[dict[str, float | int]]:
    """
    Group image locations into geographic density bins.

    The coordinate grid is divided into cells whose latitude and longitude
    dimensions are determined by ``resolution``. Each image with valid
    coordinates is assigned to a cell, and one heat-map point is produced at
    the centre of every occupied cell.

    Images without both a latitude and longitude are ignored.

    Args:
        images: Images whose geographic coordinates should be aggregated.
        resolution: Grid-cell size in decimal degrees. For example, ``0.1``
            creates cells spanning 0.1 degrees of latitude and longitude.
            The value must be greater than zero.

    Returns:
        A list of dictionaries representing occupied grid cells. Each
        dictionary contains:

        - ``latitude``: Latitude at the centre of the cell.
        - ``longitude``: Longitude at the centre of the cell.
        - ``count``: Number of images assigned to the cell.

        Coordinates are rounded to six decimal places. An empty list is
        returned when no images contain usable coordinates.

    Raises:
        ZeroDivisionError: If ``resolution`` is zero.
        TypeError: If an image coordinate cannot be converted to ``float``.
    """
    bins = Counter()

    for image in images:
        if image.lat is None or image.lng is None:
            continue

        lat = float(image.lat)
        lng = float(image.lng)

        lat_index = floor(lat / resolution)
        lng_index = floor(lng / resolution)

        bins[(lat_index, lng_index)] += 1

    locations = []

    for (lat_index, lng_index), count in bins.items():
        # Position the heat point in the middle of the grid cell.
        latitude = (lat_index + 0.5) * resolution
        longitude = (lng_index + 0.5) * resolution

        locations.append({
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "count": count,
        })

    return locations