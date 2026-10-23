-- 1. People
CREATE TABLE IF NOT EXISTS individuals (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20)
        CHECK (gender IN ('male', 'female'))
);

-- 2. Groups
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Group membership
-- we have to create a table to store a group with many members or opposite way.
CREATE TABLE IF NOT EXISTS groups_members (
    group_id INTEGER NOT NULL REFERENCES groups(id)
        ON DELETE CASCADE, -- delete parent row => child row is deleted too.
    member_id INTEGER NOT NULL REFERENCES individuals(id)
        ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, member_id) -- the same person cannot be added to the same group twice.
);

-- 4. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id)
        ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    detail TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    created_by INTEGER REFERENCES individuals(id)
        ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);