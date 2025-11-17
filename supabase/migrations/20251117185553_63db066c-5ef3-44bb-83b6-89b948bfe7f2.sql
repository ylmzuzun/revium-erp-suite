-- Fix critical security vulnerabilities

-- 1. Add authorization checks to consume_materials_for_order function
CREATE OR REPLACE FUNCTION consume_materials_for_order(_order_id UUID)
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
  _order_owner UUID;
BEGIN
  -- Authorization check: only admin/manager or order creator can consume materials
  SELECT created_by INTO _order_owner FROM orders WHERE id = _order_id;
  
  IF _order_owner IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF NOT (has_role(auth.uid(), 'admin') OR 
          has_role(auth.uid(), 'manager') OR 
          _order_owner = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to consume materials for this order';
  END IF;
  
  -- Existing material consumption logic
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

-- 2. Fix notify_low_material_stock function - add SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_low_material_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Restrict raw_materials table access to appropriate roles
DROP POLICY IF EXISTS "Herkes hammadde görebilir" ON raw_materials;

CREATE POLICY "Only management and operators view materials" 
ON raw_materials FOR SELECT 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'operator')
);