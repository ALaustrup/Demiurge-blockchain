-- Support 0x-prefixed 32-byte hex addresses (66 chars) and future formats.
ALTER TABLE users
    ALTER COLUMN on_chain_address TYPE VARCHAR(128);

ALTER TABLE linked_wallets
    ALTER COLUMN address TYPE VARCHAR(128);
