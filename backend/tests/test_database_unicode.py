from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from database import _ensure_mysql_utf8mb4
from models import Base, Image


class FakeMySQLConnection:
    class Dialect:
        name = "mysql"

    dialect = Dialect()

    def __init__(self, requires_conversion):
        self.requires_conversion = requires_conversion
        self.executed = []

    def scalar(self, statement):
        self.executed.append(str(statement))
        return self.requires_conversion

    def execute(self, statement):
        self.executed.append(str(statement))


def test_mysql_image_table_is_converted_to_utf8mb4_when_needed():
    connection = FakeMySQLConnection(requires_conversion=True)

    _ensure_mysql_utf8mb4(connection)

    assert "information_schema.COLUMNS" in connection.executed[0]
    assert "CONVERT TO CHARACTER SET utf8mb4" in connection.executed[1]


def test_mysql_image_table_skips_conversion_when_already_utf8mb4():
    connection = FakeMySQLConnection(requires_conversion=False)

    _ensure_mysql_utf8mb4(connection)

    assert len(connection.executed) == 1


def test_image_names_round_trip_emoji():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    image = Image(
        id="emoji-image",
        relative_url="images/emoji-image.jpg",
        original_filename="sunset-🌅.jpg",
        title="Sunset 🌅",
        subtitle="Summer 🏖️",
        lat=1,
        lng=2,
    )

    with Session(engine) as session:
        session.add(image)
        session.commit()
        session.expunge_all()
        stored = session.scalar(select(Image).where(Image.id == "emoji-image"))

    assert stored.original_filename == "sunset-🌅.jpg"
    assert stored.title == "Sunset 🌅"
    assert stored.subtitle == "Summer 🏖️"