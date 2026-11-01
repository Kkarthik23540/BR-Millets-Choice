ALTER TABLE inventory_movements
  DROP CONSTRAINT IF EXISTS inventory_movements_variant_id_fkey;

ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

