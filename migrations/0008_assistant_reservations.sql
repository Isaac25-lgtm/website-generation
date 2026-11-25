-- Track an in-flight call until its original UTC day's allowance is settled.
CREATE TABLE assistant_reservations (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL REFERENCES assistant_usage(day),
  tokens INTEGER NOT NULL CHECK (tokens > 0)
);
CREATE INDEX assistant_reservations_day ON assistant_reservations(day);

CREATE TRIGGER reserve_assistant_allowance AFTER INSERT ON assistant_reservations
BEGIN
  UPDATE assistant_usage SET reserved_tokens = reserved_tokens + NEW.tokens WHERE day = NEW.day;
END;
