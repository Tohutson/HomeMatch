ALTER TABLE users
    ADD display_name VARCHAR(255);

ALTER TABLE users
    ADD supabase_user_id VARCHAR(255);

ALTER TABLE users
    ALTER COLUMN supabase_user_id SET NOT NULL;

ALTER TABLE users
    ADD CONSTRAINT uc_users_supabase_user UNIQUE (supabase_user_id);

ALTER TABLE users
    DROP COLUMN created_at;

ALTER TABLE users
    DROP COLUMN is_verified;

ALTER TABLE users
    DROP COLUMN password_hash;

ALTER TABLE users
    DROP COLUMN provider;

ALTER TABLE users
    ALTER COLUMN email SET NOT NULL;