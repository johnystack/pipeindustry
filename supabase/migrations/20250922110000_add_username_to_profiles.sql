ALTER TABLE profiles
ADD COLUMN username TEXT;

UPDATE profiles
SET username = lower(first_name || last_name) || substr(md5(random()::text), 0, 3)
WHERE username IS NULL;

ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL,
ADD CONSTRAINT unique_username UNIQUE (username);
