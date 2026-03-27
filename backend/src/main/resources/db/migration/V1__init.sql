CREATE TABLE listings (
  id INTEGER PRIMARY KEY,
  address TEXT NOT NULL,
  price INTEGER,
  sqft INTEGER,
  beds INTEGER,
  baths DOUBLE PRECISION,
  listing_url TEXT,
  all_photo_urls TEXT
);