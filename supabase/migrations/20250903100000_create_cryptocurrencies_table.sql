CREATE TABLE cryptocurrencies (
    id text PRIMARY KEY,
    symbol text NOT NULL,
    name text NOT NULL,
    color text,
    network text,
    fee numeric,
    min_withdraw numeric
);

INSERT INTO cryptocurrencies (id, symbol, name, color, network, fee, min_withdraw) VALUES
('bitcoin', 'BTC', 'Bitcoin', 'text-orange-400', 'Bitcoin', 0.0002, 0.001),
('ethereum', 'ETH', 'Ethereum', 'text-gray-400', 'ERC20', 0.001, 0.01),
('tether', 'USDT', 'Tether', 'text-green-400', 'TRC20', 1, 10);
