-- +migrate Down

DROP TABLE IF EXISTS refresh_token;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS factories;
DROP TABLE IF EXISTS locations;