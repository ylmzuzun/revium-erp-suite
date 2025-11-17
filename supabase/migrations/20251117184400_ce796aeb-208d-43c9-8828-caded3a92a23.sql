-- 1. Hammadde Kategorileri Enum
CREATE TYPE material_category AS ENUM (
  'chemical',
  'metal',
  'plastic',
  'electronic',
  'packaging',
  'other'
);

-- 2. Hammadde Tablosu
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category material_category NOT NULL DEFAULT 'other',
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  max_stock NUMERIC,
  unit TEXT NOT NULL DEFAULT 'Adet',
  cost NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  description TEXT,
  location TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ürün Reçetesi Tablosu (Product BOM - Bill of Materials)
CREATE TABLE product_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity_per_unit NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, raw_material_id)
);

-- 4. Hammadde İşlem Türü Enum
CREATE TYPE material_transaction_type AS ENUM (
  'purchase',
  'consumption',
  'adjustment',
  'return'
);

-- 5. Hammadde İşlemleri Tablosu
CREATE TABLE material_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
  transaction_type material_transaction_type NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RLS Policies
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes hammadde görebilir" ON raw_materials
  FOR SELECT USING (true);

CREATE POLICY "Admin ve manager hammadde ekleyebilir" ON raw_materials
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin ve manager hammadde güncelleyebilir" ON raw_materials
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin hammadde silebilir" ON raw_materials
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Herkes reçete görebilir" ON product_recipes
  FOR SELECT USING (true);

CREATE POLICY "Admin ve manager reçete ekleyebilir" ON product_recipes
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin ve manager reçete güncelleyebilir" ON product_recipes
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin ve manager reçete silebilir" ON product_recipes
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Herkes işlem görebilir" ON material_transactions
  FOR SELECT USING (true);

CREATE POLICY "Herkes işlem ekleyebilir" ON material_transactions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 7. Triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON raw_materials
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON product_recipes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION audit_raw_materials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit('CREATE', 'raw_materials', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit('UPDATE', 'raw_materials', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit('DELETE', 'raw_materials', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_raw_materials_changes
  AFTER INSERT OR UPDATE OR DELETE ON raw_materials
  FOR EACH ROW EXECUTE FUNCTION audit_raw_materials();

-- 8. Function: Otomatik stok düşürme
CREATE OR REPLACE FUNCTION consume_materials_for_order(
  _order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _item RECORD;
  _recipe RECORD;
  _total_needed NUMERIC;
  _current_stock NUMERIC;
  _material_name TEXT;
BEGIN
  FOR _item IN 
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = _order_id
  LOOP
    FOR _recipe IN 
      SELECT raw_material_id, quantity_per_unit
      FROM product_recipes
      WHERE product_id = _item.product_id
    LOOP
      _total_needed := _recipe.quantity_per_unit * _item.quantity;
      
      SELECT stock, name INTO _current_stock, _material_name
      FROM raw_materials 
      WHERE id = _recipe.raw_material_id;
      
      IF _current_stock < _total_needed THEN
        RAISE EXCEPTION 'Yetersiz % stoğu! Mevcut: %, Gerekli: %', 
          _material_name, _current_stock, _total_needed;
      END IF;
      
      UPDATE raw_materials
      SET stock = stock - _total_needed
      WHERE id = _recipe.raw_material_id;
      
      INSERT INTO material_transactions (
        raw_material_id,
        transaction_type,
        quantity,
        reference_type,
        reference_id,
        created_by
      ) VALUES (
        _recipe.raw_material_id,
        'consumption',
        -_total_needed,
        'order',
        _order_id,
        auth.uid()
      );
    END LOOP;
  END LOOP;
END;
$$;

-- 9. Trigger: Sipariş tamamlandığında otomatik stok düşür
CREATE OR REPLACE FUNCTION auto_consume_materials_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    PERFORM consume_materials_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_consume_materials
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_consume_materials_on_order_complete();

-- 10. Function: Düşük stok bildirimi
CREATE OR REPLACE FUNCTION notify_low_material_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stock < NEW.min_stock AND (OLD.stock IS NULL OR OLD.stock >= OLD.min_stock) THEN
    INSERT INTO notifications (user_id, type, title, message)
    SELECT 
      ur.user_id,
      'warning',
      'Düşük Hammadde Stoğu',
      NEW.name || ' stoğu minimum seviyenin altına düştü (' || NEW.stock || ' ' || NEW.unit || ')'
    FROM user_roles ur
    WHERE ur.role IN ('admin', 'manager');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_low_material_stock_notification
  AFTER UPDATE ON raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_material_stock();

-- 11. Indexes
CREATE INDEX idx_raw_materials_sku ON raw_materials(sku);
CREATE INDEX idx_raw_materials_category ON raw_materials(category);
CREATE INDEX idx_product_recipes_product_id ON product_recipes(product_id);
CREATE INDEX idx_product_recipes_material_id ON product_recipes(raw_material_id);
CREATE INDEX idx_material_transactions_material_id ON material_transactions(raw_material_id);
CREATE INDEX idx_material_transactions_reference ON material_transactions(reference_type, reference_id);