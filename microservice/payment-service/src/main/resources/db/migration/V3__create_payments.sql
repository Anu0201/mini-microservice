CREATE TABLE payments (
    id           BIGSERIAL PRIMARY KEY,
    invoice_id   BIGINT         NOT NULL REFERENCES invoices(id),
    user_id      BIGINT         NOT NULL,
    amount       NUMERIC(15, 2) NOT NULL,
    method       VARCHAR(50),
    provider_ref VARCHAR(255),
    status       VARCHAR(20)    NOT NULL DEFAULT 'SUCCESS',
    paid_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);