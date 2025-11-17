-- Güvenlik uyarılarını düzelt: Fonksiyonlara search_path ekle

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

CREATE OR REPLACE FUNCTION consume_materials_for_order(
  _order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION auto_consume_materials_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    PERFORM consume_materials_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_low_material_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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