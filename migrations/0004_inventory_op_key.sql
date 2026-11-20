-- Stock adjustments from the product editor carry a stable edit id (op_key). Replaying the same request
-- applies nothing more, while sales made in between are preserved (stock changes are always relative).
ALTER TABLE inventory_movements ADD COLUMN op_key TEXT;
CREATE INDEX idx_invmov_op ON inventory_movements(variant_id, op_key) WHERE op_key IS NOT NULL;
