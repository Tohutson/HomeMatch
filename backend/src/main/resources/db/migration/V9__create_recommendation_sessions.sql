CREATE TABLE IF NOT EXISTS recommendation_sessions (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avg_price NUMERIC(12, 2),
    avg_beds DOUBLE PRECISION,
    avg_baths DOUBLE PRECISION,
    avg_sqft DOUBLE PRECISION,
    avg_energy_star_score DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendation_sessions_user_id
    ON recommendation_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_sessions_expires_at
    ON recommendation_sessions(expires_at);

CREATE TABLE IF NOT EXISTS recommendation_session_zip_codes (
    recommendation_session_id UUID NOT NULL REFERENCES recommendation_sessions(id) ON DELETE CASCADE,
    zip_code VARCHAR(5) NOT NULL,
    PRIMARY KEY (recommendation_session_id, zip_code)
);

CREATE TABLE IF NOT EXISTS recommendation_session_listing_ids (
    recommendation_session_id UUID NOT NULL REFERENCES recommendation_sessions(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL,
    PRIMARY KEY (recommendation_session_id, listing_id)
);
