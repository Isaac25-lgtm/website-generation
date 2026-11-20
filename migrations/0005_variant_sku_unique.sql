-- A variant SKU identifies exactly one variant within a store (CSV imports address variants by SKU).
-- Production was checked for existing duplicates before adding this (0 duplicate groups on 20 Nov 2026).
CREATE UNIQUE INDEX idx_variants_sku ON product_variants(project_id, sku) WHERE sku IS NOT NULL AND sku <> '';
