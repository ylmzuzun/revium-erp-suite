-- Bildirim oluşturma politikasını düzelt
-- Şu an sadece kendi user_id'sine bildirim oluşturabiliyoruz, 
-- ama görev atarken başkalarına da bildirim göndermemiz gerekiyor

DROP POLICY IF EXISTS "Kimlik doğrulanmış kullanıcılar bildirim oluşturabilir" ON notifications;

CREATE POLICY "Herkes bildirim oluşturabilir" 
ON notifications
FOR INSERT 
WITH CHECK (true);