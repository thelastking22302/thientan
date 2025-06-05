-- +migrate Up

CREATE TABLE locations (
    location_id VARCHAR PRIMARY KEY,
    name_local VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE factories (
    factory_id VARCHAR PRIMARY KEY,
    name_factory VARCHAR(50) NOT NULL,
    location_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_location FOREIGN KEY (location_id)
        REFERENCES locations(location_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE products (
    product_id VARCHAR PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    image VARCHAR NOT NULL,
    status VARCHAR(50) NOT NULL,
    year_product DATE NOT NULL,
    describe_product TEXT NOT NULL,
    factory_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_factory FOREIGN KEY (factory_id)
        REFERENCES factories(factory_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    account VARCHAR NOT NULL,
    password_user VARCHAR NOT NULL,
    tag VARCHAR(50),
    role_user VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_token (
	token_id VARCHAR PRIMARY KEY,
	user_id VARCHAR NOT NULL,
	expires_at TIMESTAMP NOT NULL,
	revoked BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_user FOREIGN KEY (user_id)
		REFERENCES users(user_id)
		ON UPDATE CASCADE
		ON DELETE CASCADE
);
