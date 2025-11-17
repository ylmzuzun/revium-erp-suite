-- Production orders tablosuna customer_id kolonu ekle
ALTER TABLE production_orders 
ADD COLUMN customer_id UUID REFERENCES customers(id);

-- Index ekle performans için
CREATE INDEX idx_production_orders_customer_id ON production_orders(customer_id);