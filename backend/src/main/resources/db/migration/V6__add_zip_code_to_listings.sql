-- Enable trigram extension (must come before index)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Add the column
ALTER TABLE listings
    ADD COLUMN zip_code VARCHAR(5);

-- 2. Populate zip_code from address
UPDATE listings
SET zip_code = substring(address FROM '([0-9]{5})$')
WHERE address IS NOT NULL;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_zip_code
    ON listings(zip_code);

CREATE INDEX IF NOT EXISTS idx_listings_price
    ON listings(price);

CREATE INDEX IF NOT EXISTS idx_listings_address_trgm
    ON listings
        USING gin (address gin_trgm_ops);