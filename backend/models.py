from sqlalchemy import Column, Float, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Image(Base):
    __tablename__ = "images"

    id = Column(String(128), primary_key=True)
    relative_url = Column(String(255), nullable=False)
    title = Column(String(255))
    subtitle = Column(String(255))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)