from math import radians, asin, sin, cos, sqrt, exp
from config import BONUS_POINTS, BONUS_RADIUS_METERS

# Helpers for handling game specific logic live here

# --- Score Calculation Logic ---
def haversine(lat1, lon1, lat2, lon2) -> float:
    """
    Calculate the great-circle distance between two geographic coordinates.

    The calculation uses the haversine formula and assumes Earth is a sphere
    with a mean radius of 6,371,000 metres.

    Args:
        lat1: Latitude of the first point in decimal degrees.
        lon1: Longitude of the first point in decimal degrees.
        lat2: Latitude of the second point in decimal degrees.
        lon2: Longitude of the second point in decimal degrees.

    Returns:
        The approximate distance between the two points in metres.
    """
    R = 6371000.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(a))


def calc_score(dist_m) -> int:
    """
    Calculate a game score from the distance of a player's guess.

    Scores use exponential decay so that close guesses are rewarded more
    strongly. A perfect guess receives 5,000 points, with the score decreasing
    as the distance increases.

    Approximate scores using the configured 4,000 km decay scale include:

    - 0 km: 5,000 points
    - 1,000 km: 3,894 points
    - 2,000 km: 3,033 points
    - 5,000 km: 1,433 points
    - 10,000 km: 410 points
    - 20,000 km: 34 points

    Args:
        dist_m: Distance between the guessed and actual locations in metres.
            The value is expected to be non-negative.

    Returns:
        The calculated score, rounded to the nearest whole point. Returns
        ``0`` when the distance exceeds the maximum scorable distance.
    """
    D_MAX = 20_000_000 # (m) max scorable distance, based on the rough maximum distance between places on a globe
    SCORE_MAX = 5000 # the maximum allowable score (perfect guess)
    LAMBDA = 4_000_000 # is a “scale” parameter (in m). Roughly: distance where score has dropped to ~37% of max.

    if dist_m > D_MAX:
        return 0

    return round(SCORE_MAX * exp(-dist_m / LAMBDA))


def compute_bonus(distance_meters: float) -> int:
    """
    Calculate the proximity bonus for a guess.

    The configured bonus is awarded when the guess is within or exactly on
    ``BONUS_RADIUS_METERS`` of the correct location.

    Args:
        distance_meters: Distance between the guessed and actual locations
            in metres.

    Returns:
        ``BONUS_POINTS`` when the distance is within the bonus radius;
        otherwise, ``0``.
    """
    return BONUS_POINTS if distance_meters <= BONUS_RADIUS_METERS else 0
