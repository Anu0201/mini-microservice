CREATE TABLE invoice_items (
    id          BIGSERIAL PRIMARY KEY,
    invoice_id  BIGINT         NOT NULL REFERENCES invoices(id),
    name        VARCHAR(255)   NOT NULL,
    qty         INTEGER        NOT NULL DEFAULT 1,
    unit_price  NUMERIC(15, 2) NOT NULL,
    line_total  NUMERIC(15, 2) NOT NULL
);