CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  twofa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plaid_access_token VARCHAR(255),
  institution VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  card_name VARCHAR(255),
  apr NUMERIC(5,2),
  balance NUMERIC(12,2),
  due_date DATE,
  rewards JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  card_id INTEGER REFERENCES cards(id),
  amount NUMERIC(12,2),
  merchant VARCHAR(255),
  category VARCHAR(255),
  date DATE
);

CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  event_type VARCHAR(50),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 