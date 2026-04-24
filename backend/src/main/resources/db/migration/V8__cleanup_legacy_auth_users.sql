DELETE FROM favorites
WHERE user_id IN (
    SELECT id
    FROM users
    WHERE supabase_user_id LIKE 'legacy-%'
);

DELETE FROM users
WHERE supabase_user_id LIKE 'legacy-%';

ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;
