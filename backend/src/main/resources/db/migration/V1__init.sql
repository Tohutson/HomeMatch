CREATE TABLE IF NOT EXISTS listings (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  address        TEXT NOT NULL,
  price          NUMERIC(12, 2),
  sqft           INTEGER,
  beds           INTEGER,
  baths          NUMERIC(3, 1),
  listing_url    TEXT,
  listing_photos TEXT
);