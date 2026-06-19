CREATE TABLE invoices (
    id             BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50)    NOT NULL UNIQUE,
    user_id        BIGINT         NOT NULL,
    amount         NUMERIC(15, 2) NOT NULL,
    currency       VARCHAR(10)    NOT NULL DEFAULT 'MNT',
    status         VARCHAR(20)    NOT NULL DEFAULT 'UNPAID',
    description    TEXT,
    due_date       DATE,
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);