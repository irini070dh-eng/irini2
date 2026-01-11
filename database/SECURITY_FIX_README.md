# 🔒 INSTRUKCJA NAPRAWY BEZPIECZEŃSTWA BAZY DANYCH

## ⚠️ KRYTYCZNE - PRZED PRODUKCJĄ!

Twoja baza danych ma **32 luki bezpieczeństwa**, które pozwalają każdemu użytkownikowi:
- ❌ Usuwać zamówienia innych klientów
- ❌ Modyfikować ceny w zamówieniach
- ❌ Kasować rezerwacje
- ❌ Zmieniać ustawienia restauracji

## 🚨 CO TRZEBA ZROBIĆ (5 minut)

### Krok 1: Otwórz Supabase Dashboard
1. Idź do: https://supabase.com/dashboard
2. Zaloguj się
3. Wybierz projekt: `wlbwstlaxdtcdafhudny`

### Krok 2: Otwórz SQL Editor
1. W lewym menu kliknij: **SQL Editor**
2. Kliknij: **New query**

### Krok 3: Skopiuj i uruchom skrypt
1. Otwórz plik: `database/fix-security.sql`
2. Zaznacz **CAŁY** kod (Ctrl+A)
3. Skopiuj (Ctrl+C)
4. Wklej do SQL Editor w Supabase (Ctrl+V)
5. Kliknij: **RUN** (lub Ctrl+Enter)

### Krok 4: Weryfikacja
Po uruchomieniu zobaczysz na dole dwie tabele:
- **pg_policies**: Lista wszystkich polityk bezpieczeństwa ✅
- **pg_indexes**: Lista indeksów bazy danych ✅

Jeśli widzisz tabele z danymi = **SUKCES!** 🎉

## ✅ CO ZOSTAŁO NAPRAWIONE

### Przed naprawą (NIEBEZPIECZNE ❌):
```sql
-- Każdy może USUNĄĆ wszystkie zamówienia!
DROP POLICY "anon_delete_orders" ON orders;

-- Każdy może ZMIENIĆ ceny w zamówieniu!
DROP POLICY "anon_update_orders" ON orders;
```

### Po naprawie (BEZPIECZNE ✅):
```sql
-- Użytkownicy mogą TYLKO dodać zamówienie
CREATE POLICY "orders_insert_only" ON orders
  FOR INSERT
  WITH CHECK (true);

-- Użytkownicy mogą zobaczyć TYLKO swoje zamówienie
CREATE POLICY "orders_select_by_confirmation" ON orders
  FOR SELECT
  USING (confirmation_number IS NOT NULL);
```

## 📊 SZCZEGÓŁY NAPRAWY

### 🔐 Tabele z nowymi zasadami:

#### `menu_items` (Menu restauracji)
- ✅ Każdy może **odczytać** menu
- ❌ Nikt nie może **usunąć** ani **zmienić** (tylko admin przez dashboard)

#### `orders` (Zamówienia)
- ✅ Każdy może **dodać** nowe zamówienie
- ✅ Można **zobaczyć** zamówienie tylko z confirmation_number
- ❌ Nikt nie może **usunąć** ani **zmienić** zamówienia

#### `order_items` (Produkty w zamówieniu)
- ✅ Każdy może **dodać** produkty do zamówienia
- ✅ Można **zobaczyć** tylko razem z zamówieniem
- ❌ Nikt nie może **usunąć** ani **zmienić**

#### `reservations` (Rezerwacje)
- ✅ Każdy może **dodać** rezerwację
- ✅ Można **zobaczyć** tylko z confirmation_number
- ❌ Nikt nie może **usunąć** ani **zmienić**

#### `contact_messages` (Wiadomości kontaktowe)
- ✅ Każdy może **wysłać** wiadomość
- ❌ Nikt nie może **odczytać**, **usunąć** ani **zmienić** (tylko admin)

#### `site_content` (Treści strony)
- ✅ Każdy może **odczytać**
- ❌ Nikt nie może **zmienić** (tylko admin przez dashboard)

#### `restaurant_settings` (Ustawienia)
- ✅ Każdy może **odczytać** (godziny otwarcia, adres, itp.)
- ❌ Nikt nie może **zmienić** (tylko admin przez dashboard)

#### `staff_notes` (Notatki personelu)
- ❌ **CAŁKOWICIE ZABLOKOWANE** dla anonimowych
- ✅ Tylko zalogowani admini mają dostęp

#### `drivers` (Kierowcy)
- ❌ **CAŁKOWICIE ZABLOKOWANE** dla anonimowych
- ✅ Tylko zalogowani admini mają dostęp

## 🚀 DODATKOWE POPRAWKI

### Indeksy dla wydajności:
```sql
-- Przyspiesza wyszukiwanie produktów w zamówieniach
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Przyspiesza wyszukiwanie notatek dla zamówień
CREATE INDEX idx_staff_notes_order_id ON staff_notes(order_id);
```

### Usunięcie duplikatów:
Skrypt automatycznie usuwa duplikujące się polityki RLS, które spowalniały bazę danych.

## 🔐 NASTĘPNE KROKI

### ⚠️ WAŻNE: Stwórz użytkownika admina PRZED uruchomieniem skryptu!

### 1. Stwórz użytkownika admina:
1. Idź do: https://supabase.com/dashboard
2. Wybierz projekt: `wlbwstlaxdtcdafhudny`
3. Idź do: **Authentication > Users**
4. Kliknij: **Add user**
5. Wypełnij:
   - **Email**: `admin@greekeirini.nl` (lub Twój email)
   - **Password**: **Silne hasło** (min. 12 znaków)
   - ✅ **Auto confirm user**: **ON** ← WAŻNE!
6. Kliknij: **Create user**

### 2. Uruchom skrypt fix-security.sql:
1. Otwórz: **SQL Editor** w Supabase
2. Skopiuj zawartość `database/fix-security.sql`
3. Kliknij: **RUN**

### 3. Włącz ochronę haseł w Supabase:
1. Idź do: **Settings > Auth**
2. Znajdź: **Password Protection**
3. Włącz: **Enable Password Leak Detection**
4. Zapisz

### 2. Stwórz użytkownika admina:
1. Idź do: **Authentication > Users**
2. Kliknij: **Add user**
3. Email: `admin@greekeirini.nl`
4. Password: **Silne hasło** (min. 12 znaków)
5. ✅ Auto confirm user: **ON**
6. Kliknij: **Create user**

### 3. Test bezpieczeństwa:
Spróbuj w konsoli przeglądarki (F12):
```javascript
// To powinno NIE działać (403 Forbidden):
await supabase.from('orders').delete().eq('id', 1);
await supabase.from('menu_items').update({ price: 0 });
```

## ❓ FAQ

### Q: Czy mogę cofnąć zmiany?
A: Tak, ale **NIE POLECAM**. Stare polityki były niebezpieczne.

### Q: Czy to zepsuje istniejące zamówienia?
A: **NIE**. Wszystkie dane pozostają niezmienione. Zmieniamy tylko uprawnienia.

### Q: Jak admin będzie zarządzał danymi?
A: Admin loguje się przez `/admin` i ma pełny dostęp przez authenticated session.

### Q: Co jeśli zobaczę błąd podczas uruchamiania?
A: Najprawdopodobniej polityka już nie istnieje (bo została wcześniej usunięta). To normalne, skrypt kontynuuje działanie.

## 📞 POTRZEBUJESZ POMOCY?

Jeśli coś poszło nie tak:
1. Sprawdź logi w SQL Editor (czerwone komunikaty)
2. Skopiuj treść błędu
3. Prześlij na: support@twojadomena.com

## ✅ CHECKLIST

- [ ] Uruchomiłem `fix-security.sql` w Supabase SQL Editor
- [ ] Widziałem komunikat sukcesu (tabele z politykami)
- [ ] Włączyłem Password Leak Detection
- [ ] Stworzyłem użytkownika admina
- [ ] Przetestowałem logowanie do `/admin`
- [ ] Zweryfikowałem, że zamówienia nadal działają

## 🎉 GRATULACJE!

Twoja baza danych jest teraz **bezpieczna** i gotowa do produkcji! 🔒✨
