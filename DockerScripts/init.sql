-- CREATE TABLE clientes (
--   id SERIAL PRIMARY KEY,
--   limite INT,
--   saldo INT
-- );

-- CREATE TABLE transacoes (
--   client_id INT,
--   valor INT,
--   tipo VARCHAR(1),
--   descricao VARCHAR(10),
--   data_transacao TIMESTAMPTZ,
--   CONSTRAINT fk_client
--       FOREIGN KEY(client_id) 
--         REFERENCES clientes(id)
-- );

-- DO $$
-- BEGIN
--   INSERT INTO clientes (id, limite, saldo)
--   VALUES
--     (1, 1000 * 100, 0),
--     (2, 800 * 100, 0),
--     (3, 10000 * 100, 0),
--     (4, 100000 * 100, 0),
--     (5, 5000 * 100, 0);
-- END; $$;

-- CREATE INDEX idx_client ON transacoes (client_id ASC);

-- CREATE OR REPLACE FUNCTION notify_clientes_trigger()
-- RETURNS TRIGGER AS
-- $$
-- BEGIN
--   -- Envia uma notificação quando uma linha é inserida, atualizada ou excluída
--   PERFORM pg_notify('clientes_changes', JSON_BUILD_OBJECT('id', NEW.id, 'limite', NEW.limite, 'saldo', NEW.saldo)::text);
--   RETURN NEW;
-- END;
-- $$
-- LANGUAGE plpgsql;

-- CREATE TRIGGER clientes_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON clientes
-- FOR EACH ROW EXECUTE FUNCTION notify_clientes_trigger();


CREATE TYPE transaction_type AS ENUM ('c', 'd');

CREATE TABLE IF NOT EXISTS clientes(
    id SERIAL PRIMARY KEY NOT NULL,
    saldo integer NOT NULL,
    limite integer NOT NULL
);

CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL,
    client_id SMALLINT,
    data_transacao TIMESTAMPTZ,
    valor integer,
    tipo transaction_type,
    descricao varchar(10),
    CONSTRAINT transactions_pk PRIMARY KEY (client_id, id),
    CONSTRAINT transactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES clientes (id) ON DELETE RESTRICT ON UPDATE CASCADE
) PARTITION BY LIST (client_id);

CREATE TABLE transactions_partition_1 PARTITION OF transacoes FOR VALUES IN (1);
CREATE TABLE transactions_partition_2 PARTITION OF transacoes FOR VALUES IN (2);
CREATE TABLE transactions_partition_3 PARTITION OF transacoes FOR VALUES IN (3);
CREATE TABLE transactions_partition_4 PARTITION OF transacoes FOR VALUES IN (4);
CREATE TABLE transactions_partition_5 PARTITION OF transacoes FOR VALUES IN (5);

CREATE INDEX idx_transactions_composite
ON transacoes (valor, tipo, data_transacao DESC);

INSERT INTO clientes (saldo, limite)
VALUES 
(0, 100000),
(0, 80000),
(0, 1000000),
(0, 10000000),
(0, 500000);