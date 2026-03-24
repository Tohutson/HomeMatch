CREATE TABLE listings (
  id BIGINT PRIMARY KEY,
  address TEXT NOT NULL,
  price NUMERIC,
  sqft NUMERIC,
  beds INTEGER,
  baths NUMERIC,
  listing_url TEXT,
  photo_1 TEXT,
  photo_2 TEXT,
  photo_3 TEXT,
  photo_4 TEXT,
  photo_5 TEXT,
  all_photo_urls TEXT
);