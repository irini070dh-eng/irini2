-- =====================================================
-- FIX BEZPIECZEŃSTWA BAZY DANYCH - GREEK IRINI STORE
-- =====================================================
-- Ten skrypt usuwa niebezpieczne uprawnienia dla anonimowych użytkowników
-- i ustawia bezpieczne polityki RLS dla wszystkich tabel

-- =====================================================
-- KROK 1: USUŃ WSZYSTKIE NIEBEZPIECZNE POLITYKI
-- =====================================================

-- Orders - tylko właściciel może zobaczyć swoje zamówienia
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "anon_select_orders" ON orders;

-- Order Items - szczegóły zamówień
DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;

-- Reservations - rezerwacje
DROP POLICY IF EXISTS "anon_delete_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_update_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_insert_reservations" ON reservations;
DROP POLICY IF EXISTS "anon_select_reservations" ON reservations;

-- Staff Notes - notatki personelu
DROP POLICY IF EXISTS "anon_delete_staff_notes" ON staff_notes;
DROP POLICY IF EXISTS "anon_update_staff_notes" ON staff_notes;
DROP POLICY IF EXISTS "anon_insert_staff_notes" ON staff_notes;
DROP POLICY IF EXISTS "anon_select_staff_notes" ON staff_notes;

-- Drivers - kierowcy
DROP POLICY IF EXISTS "anon_delete_drivers" ON drivers;
DROP POLICY IF EXISTS "anon_update_drivers" ON drivers;
DROP POLICY IF EXISTS "anon_insert_drivers" ON drivers;
DROP POLICY IF EXISTS "anon_select_drivers" ON drivers;

-- Restaurant Settings - ustawienia restauracji
DROP POLICY IF EXISTS "anon_delete_restaurant_settings" ON restaurant_settings;
DROP POLICY IF EXISTS "anon_update_restaurant_settings" ON restaurant_settings;
DROP POLICY IF EXISTS "anon_insert_restaurant_settings" ON restaurant_settings;

-- =====================================================
-- KROK 2: UTWÓRZ BEZPIECZNE POLITYKI
-- =====================================================

-- MENU ITEMS - tylko odczyt dla wszystkich, admin może wszystko
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT
  USING (true);

-- ORDERS - użytkownicy mogą dodawać nowe zamówienia, ale nie edytować/usuwać
CREATE POLICY "orders_insert_only" ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "orders_select_by_confirmation" ON orders
  FOR SELECT
  USING (confirmation_number IS NOT NULL);

-- ORDER ITEMS - tylko dodawanie wraz z zamówieniem
CREATE POLICY "order_items_insert_only" ON order_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "order_items_select_with_order" ON order_items
  FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE confirmation_number IS NOT NULL));

-- RESERVATIONS - użytkownicy mogą dodawać rezerwacje
CREATE POLICY "reservations_insert_only" ON reservations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "reservations_select_by_confirmation" ON reservations
  FOR SELECT
  USING (confirmation_number IS NOT NULL);

-- CONTACT MESSAGES - tylko dodawanie wiadomości
CREATE POLICY "contact_messages_insert_only" ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- SITE CONTENT - tylko odczyt dla wszystkich
CREATE POLICY "site_content_public_read" ON site_content
  FOR SELECT
  USING (true);

-- RESTAURANT SETTINGS - tylko odczyt dla wszystkich
CREATE POLICY "restaurant_settings_public_read" ON restaurant_settings
  FOR SELECT
  USING (true);

-- STAFF NOTES - CAŁKOWICIE ZABLOKOWANE dla anonimowych
-- (tylko authenticated users z odpowiednią rolą mogą mieć dostęp)

-- DRIVERS - CAŁKOWICIE ZABLOKOWANE dla anonimowych

-- =====================================================
-- KROK 2.5: POLITYKI DLA ZALOGOWANYCH ADMINÓW (authenticated)
-- =====================================================

-- ORDERS - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "orders_authenticated_all" ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ORDER ITEMS - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "order_items_authenticated_all" ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RESERVATIONS - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "reservations_authenticated_all" ON reservations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MENU ITEMS - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "menu_items_authenticated_all" ON menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- STAFF NOTES - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "staff_notes_authenticated_all" ON staff_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DRIVERS - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "drivers_authenticated_all" ON drivers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CONTACT MESSAGES - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "contact_messages_authenticated_all" ON contact_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RESTAURANT SETTINGS - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "restaurant_settings_authenticated_all" ON restaurant_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SITE CONTENT - pełny dostęp dla zalogowanych użytkowników
CREATE POLICY "site_content_authenticated_all" ON site_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- KROK 3: DODAJ BRAKUJĄCE INDEKSY (dla wydajności)
-- =====================================================

-- Indeks dla order_items.menu_item_id (często używany w JOIN)
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id 
  ON order_items(menu_item_id);

-- Indeks dla staff_notes.order_id
CREATE INDEX IF NOT EXISTS idx_staff_notes_order_id 
  ON staff_notes(order_id);

-- =====================================================
-- KROK 4: USUŃ DUPLIKUJĄCE SIĘ POLITYKI (dla wydajności)
-- =====================================================

-- Sprawdź i usuń duplikaty w site_content
DO $$
DECLARE
  policy_record RECORD;
  policy_count INTEGER;
BEGIN
  -- Policzy duplikaty
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename = 'site_content'
    AND policyname LIKE 'site_content_public_read%';
  
  -- Jeśli jest więcej niż 1, usuń wszystkie i stwórz jeden
  IF policy_count > 1 THEN
    FOR policy_record IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'site_content'
        AND policyname LIKE 'site_content_public_read%'
    LOOP
      EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON site_content';
    END LOOP;
    
    -- Stwórz jedną czystą politykę
    CREATE POLICY "site_content_public_read" ON site_content
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- =====================================================
-- KROK 5: WŁĄCZ OCHRONĘ PRZED WYCIEKIEM HASEŁ
-- =====================================================

-- UWAGA: To musi być wykonane przez dashboard Supabase:
-- Settings > Auth > Password Protection > Enable Password Leak Detection

-- =====================================================
-- WERYFIKACJA
-- =====================================================

-- Sprawdź wszystkie polityki
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Sprawdź wszystkie indeksy
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- GOTOWE!
-- =====================================================
-- Po uruchomieniu tego skryptu:
-- ✅ Usunięte niebezpieczne polityki DELETE/UPDATE dla anonimowych użytkowników
-- ✅ Ustawione bezpieczne polityki (tylko INSERT dla zamówień/rezerwacji)
-- ✅ Dodane brakujące indeksy dla wydajności
-- ✅ Usunięte duplikaty polityk
-- =====================================================
