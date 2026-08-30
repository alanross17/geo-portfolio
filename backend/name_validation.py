import re
import unicodedata


BLOCKED_WORDS = frozenset({
    # General profanity
    "arsehole",
    "asshole",
    "bastard",
    "bitch",
    "bullshit",
    "cunt",
    "dickhead",
    "douche",
    "douchebag",
    "fuck",
    "fucked",
    "fucker",
    "fuckers",
    "fucking",
    "motherfucker",
    "motherfuckers",
    "motherfucking",
    "prick",
    "shit",
    "shithead",
    "shitheads",
    "shitty",
    "twat",
    "wanker",
    "whore",

    # Sexual insults or explicit terms
    "cocksucker",
    "cumslut",
    "dickwad",
    "fuckface",
    "fuckhead",
    "jackass",
    "pissface",
    "pussy",
    "slut",

    # Discriminatory slurs
    "chink",
    "coon",
    "fag",
    "faggot",
    "gook",
    "kike",
    "nigga",
    "nigger",
    "paki",
    "raghead",
    "retard",
    "spic",
    "tranny",
    "wetback",

    "ass",
    "balls",
    "boob",
    "boobs",
    "butt",
    "cock",
    "damn",
    #"dick",       # Also a legitimate name
    #"dyke",       # Also a geographic term
    "hell",
    "horny",
    "idiot",
    "moron",
    "penis",
    "porn",
    "sexy",
    "stupid",
    "vagina",
})

# Add any multi-word expressions you specifically want to reject.
BLOCKED_PHRASES = (
    ("dumb", "ass"),
    ("eat", "shit"),
    ("fuck", "off"),
    ("fuck", "this"),
    ("fuck", "you"),
    ("go", "fuck", "yourself"),
    ("piece", "of", "shit"),
    ("shut", "the", "fuck", "up"),
    ("son", "of", "a", "bitch"),
    ("suck", "my", "dick"),
    ("i", "hate", "you"),
    ("i", "will", "hurt", "you"),
    ("i", "will", "kill", "you"),
    ("nobody", "likes", "you"),
    ("you", "are", "worthless"),
)


class InvalidLeaderboardName(ValueError):
    """Raised when a leaderboard display name is unacceptable."""


def validate_leaderboard_name(value: object, *, max_length: int = 30) -> str:
    """
    Validate and normalize a public leaderboard display name.

    Unicode characters are preserved. Unicode normalization and case folding
    are used only to create a temporary value for profanity comparison.

    Returns:
        The trimmed display name suitable for storage.

    Raises:
        InvalidLeaderboardName: If the name is missing, too long, or contains
        an explicitly blocked word or phrase.
    """
    if not isinstance(value, str):
        raise InvalidLeaderboardName("Name must be a string.")

    name = value.strip()

    if not name:
        raise InvalidLeaderboardName("Please enter a name.")

    if len(name) > max_length:
        raise InvalidLeaderboardName(
            f"Name must be {max_length} characters or fewer."
        )

    # NFKC catches equivalent presentations such as full-width Latin letters.
    # casefold() is the Unicode-aware alternative to lower().
    comparison_value = unicodedata.normalize("NFKC", name).casefold()

    # Extract Unicode-aware letter/number sequences. Exact token matching avoids
    # blocking legitimate names merely because they contain a shorter substring.
    words = tuple(
        re.findall(r"[^\W_]+", comparison_value, flags=re.UNICODE)
    )

    if any(word in BLOCKED_WORDS for word in words):
        raise InvalidLeaderboardName(
            "Please choose a different leaderboard name."
        )

    for phrase in BLOCKED_PHRASES:
        phrase_length = len(phrase)

        if any(
            words[index:index + phrase_length] == phrase
            for index in range(len(words) - phrase_length + 1)
        ):
            raise InvalidLeaderboardName(
                "Please choose a different leaderboard name."
            )

    return name