import emailjs from '@emailjs/browser';
import { Order, Language, Reservation } from '../types';

// EmailJS Configuration
// Musisz skonfigurować te wartości na https://www.emailjs.com/
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID', // Zamień na swój Service ID z EmailJS
  templateId: 'YOUR_TEMPLATE_ID', // Zamień na swój Template ID z EmailJS
  publicKey: 'YOUR_PUBLIC_KEY', // Zamień na swój Public Key z EmailJS
};

// Sprawdź czy EmailJS jest skonfigurowany
const isConfigured = () => {
  return !EMAILJS_CONFIG.serviceId.includes('YOUR_') && 
         !EMAILJS_CONFIG.templateId.includes('YOUR_') && 
         !EMAILJS_CONFIG.publicKey.includes('YOUR_');
};

// Formatowanie pozycji zamówienia do emaila
const formatOrderItems = (order: Order, language: Language): string => {
  return order.items.map(item => 
    `${item.quantity}x ${item.name} - €${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');
};

// Formatowanie metody płatności
const formatPaymentMethod = (method: string, language: Language): string => {
  const methods: Record<string, Record<string, string>> = {
    ideal: { nl: 'iDEAL', pl: 'iDEAL' },
    card: { nl: 'Creditcard', pl: 'Karta płatnicza' },
    cash: { nl: 'Contant bij levering', pl: 'Gotówka przy odbiorze' },
    bancontact: { nl: 'Bancontact', pl: 'Bancontact' },
  };
  return methods[method]?.[language] || methods[method]?.nl || method;
};

// Formatowanie typu dostawy
const formatDeliveryType = (type: string, language: Language): string => {
  const types: Record<string, Record<string, string>> = {
    delivery: { nl: 'Bezorging', pl: 'Dostawa' },
    pickup: { nl: 'Afhalen', pl: 'Odbiór własny' },
  };
  return types[type]?.[language] || types[type]?.nl || type;
};

// Generowanie treści emaila
export const generateEmailContent = (order: Order, language: Language = 'nl') => {
  const isPolish = language === 'pl';
  
  const estimatedTime = order.delivery.type === 'pickup' 
    ? (isPolish ? '15-20 minut' : '15-20 minuten')
    : (isPolish ? '30-45 minut' : '30-45 minuten');

  return {
    // Dane odbiorcy
    to_email: order.customer.email,
    to_name: order.customer.name,
    
    // Nagłówek
    subject: isPolish 
      ? `Potwierdzenie zamówienia #${order.id}` 
      : `Orderbevestiging #${order.id}`,
    
    // Treść główna
    greeting: isPolish 
      ? `Dziękujemy za zamówienie, ${order.customer.name}!` 
      : `Bedankt voor je bestelling, ${order.customer.name}!`,
    
    order_id: order.id,
    
    // Pozycje zamówienia
    order_items: formatOrderItems(order, language),
    
    // Podsumowanie cen
    subtotal: `€${order.subtotal.toFixed(2)}`,
    delivery_fee: order.deliveryFee > 0 ? `€${order.deliveryFee.toFixed(2)}` : (isPolish ? 'Gratis' : 'Gratis'),
    total: `€${order.total.toFixed(2)}`,
    
    // Informacje o dostawie
    delivery_type: formatDeliveryType(order.delivery.type, language),
    delivery_label: isPolish ? 'Sposób dostawy' : 'Bezorgwijze',
    
    // Adres (tylko dla dostawy)
    address: order.delivery.type === 'delivery' 
      ? `${order.customer.address}, ${order.customer.postalCode} ${order.customer.city}`
      : (isPolish ? 'Odbiór w restauracji' : 'Afhalen bij het restaurant'),
    address_label: isPolish ? 'Adres' : 'Adres',
    
    // Płatność
    payment_method: formatPaymentMethod(order.payment.method, language),
    payment_label: isPolish ? 'Metoda płatności' : 'Betaalmethode',
    payment_status: order.payment.status === 'paid' 
      ? (isPolish ? 'Opłacone' : 'Betaald')
      : (isPolish ? 'Do zapłaty przy odbiorze' : 'Betalen bij levering'),
    
    // Szacowany czas
    estimated_time: estimatedTime,
    estimated_label: isPolish ? 'Szacowany czas' : 'Geschatte tijd',
    
    // Kontakt
    restaurant_name: 'Greek Irini',
    restaurant_address: 'Denneweg 10A, 2514 CG Den Haag',
    restaurant_phone: '+31 70 346 2789',
    
    // Stopka
    footer_text: isPolish 
      ? 'Dziękujemy za zamówienie w Greek Irini! W razie pytań prosimy o kontakt.'
      : 'Bedankt voor je bestelling bij Greek Irini! Neem bij vragen gerust contact met ons op.',
    
    // Uwagi klienta
    notes: order.customer.notes || (isPolish ? 'Brak uwag' : 'Geen opmerkingen'),
    notes_label: isPolish ? 'Uwagi' : 'Opmerkingen',
  };
};

// Wysyłanie emaila z potwierdzeniem
export const sendOrderConfirmationEmail = async (
  order: Order, 
  language: Language = 'nl'
): Promise<{ success: boolean; message: string }> => {
  
  // Sprawdź czy EmailJS jest skonfigurowany
  if (!isConfigured()) {
    console.log('📧 EmailJS nie skonfigurowany - symulacja wysyłki emaila');
    console.log('📧 Dane emaila:', generateEmailContent(order, language));
    
    // Symulacja sukcesu dla celów demonstracyjnych
    return {
      success: true,
      message: 'Email wysłany (tryb demo - skonfiguruj EmailJS dla prawdziwej wysyłki)',
    };
  }

  try {
    // Inicjalizacja EmailJS
    emailjs.init(EMAILJS_CONFIG.publicKey);
    
    const emailData = generateEmailContent(order, language);
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      emailData
    );

    console.log('✅ Email wysłany pomyślnie:', response);
    
    return {
      success: true,
      message: language === 'pl' 
        ? 'Potwierdzenie wysłane na email!' 
        : 'Bevestiging verzonden naar je e-mail!',
    };
  } catch (error) {
    console.error('❌ Błąd wysyłania emaila:', error);
    
    return {
      success: false,
      message: language === 'pl'
        ? 'Nie udało się wysłać emaila. Zamówienie zostało przyjęte.'
        : 'E-mail kon niet worden verzonden. Je bestelling is geplaatst.',
    };
  }
};

// Eksport konfiguracji do ustawień admina
export const getEmailJSConfig = () => ({
  isConfigured: isConfigured(),
  config: EMAILJS_CONFIG,
});

// ===== RESERVATION EMAIL FUNCTIONS =====

// Generowanie treści emaila dla potwierdzenia rezerwacji
export const generateReservationConfirmationEmail = (
  reservation: Reservation,
  adminNotes: string = '',
  language: Language = 'nl'
) => {
  const isPolish = language === 'pl';
  
  const greeting = isPolish 
    ? `Dzień dobry ${reservation.customerName}!`
    : `Goedendag ${reservation.customerName}!`;
  
  const confirmationMessage = isPolish
    ? `Z przyjemnością potwierdzamy Twoją rezerwację w Greek Irini!\n\nJest nam niezmiernie miło móc gościć Cię w naszej rodzinnej restauracji. Czekamy z niecierpliwością, aby podzielić się z Tobą autentyczną grecką gościnnością i tradycyjnymi smakami prosto z wybrzeży Morza Egejskiego.`
    : `Met veel plezier bevestigen wij uw reservering bij Greek Irini!\n\nHet is ons een eer u te mogen verwelkomen in ons familierestaurant. We kijken ernaar uit om authentieke Griekse gastvrijheid en traditionele smaken van de Egeïsche kust met u te delen.`;
  
  const detailsTitle = isPolish ? 'Szczegóły Twojej Rezerwacji:' : 'Details van uw reservering:';
  
  const dateLabel = isPolish ? 'Data' : 'Datum';
  const timeLabel = isPolish ? 'Czas' : 'Tijd';
  const guestsLabel = isPolish ? 'Liczba gości' : 'Aantal gasten';
  const notesLabel = isPolish ? 'Dodatkowe informacje' : 'Aanvullende informatie';
  
  const closingMessage = isPolish
    ? `Do zobaczenia wkrótce w Greek Irini!\n\nZ wyrazami szacunku,\nZespół Greek Irini\n\nWeimarstraat 174, 2562 HD Den Haag\nTel: 0615869325\nEmail: irini070dh@gmail.com`
    : `Tot ziens bij Greek Irini!\n\nMet vriendelijke groet,\nTeam Greek Irini\n\nWeimarstraat 174, 2562 HD Den Haag\nTel: 0615869325\nEmail: irini070dh@gmail.com`;

  return {
    to_email: reservation.customerEmail,
    to_name: reservation.customerName,
    subject: isPolish 
      ? `✓ Potwierdzenie rezerwacji - Greek Irini`
      : `✓ Reserveringsbevestiging - Greek Irini`,
    greeting,
    message: confirmationMessage,
    details_title: detailsTitle,
    date_label: dateLabel,
    date: reservation.date,
    time_label: timeLabel,
    time: reservation.time,
    guests_label: guestsLabel,
    guests: reservation.numberOfGuests.toString(),
    special_requests: reservation.specialRequests || (isPolish ? 'Brak' : 'Geen'),
    notes_label: notesLabel,
    admin_notes: adminNotes || (isPolish ? 'Wszystko przygotowane!' : 'Alles is klaar voor u!'),
    closing: closingMessage,
    restaurant_name: 'Greek Irini',
  };
};

// Generowanie treści emaila dla odrzucenia rezerwacji
export const generateReservationRejectionEmail = (
  reservation: Reservation,
  alternativeTime: string = '',
  language: Language = 'nl'
) => {
  const isPolish = language === 'pl';
  
  const greeting = isPolish 
    ? `Dzień dobry ${reservation.customerName},`
    : `Goedendag ${reservation.customerName},`;
  
  const sorryMessage = isPolish
    ? `Bardzo nam przykro, ale niestety nie możemy potwierdzić Twojej rezerwacji na dzień ${reservation.date} o godzinie ${reservation.time}.\n\nW tym terminie mamy już komplety rezerwacji.`
    : `Het spijt ons zeer, maar helaas kunnen we uw reservering voor ${reservation.date} om ${reservation.time} niet bevestigen.\n\nOp dit moment zijn we voor deze tijd volledig volgeboekt.`;
  
  const alternativeMessage = alternativeTime
    ? (isPolish 
        ? `\n\nCzy może pasowałaby Państwu inna godzina: ${alternativeTime}?\n\nJeśli tak, prosimy o kontakt telefoniczny lub mailowy, a chętnie dokonamy rezerwacji.`
        : `\n\nZou het eventueel mogelijk zijn op een ander tijdstip: ${alternativeTime}?\n\nAls dit schikt, neem dan gerust contact met ons op en we maken graag een nieuwe reservering voor u.`)
    : (isPolish
        ? `\n\nProsimy o kontakt w celu ustalenia alternatywnego terminu. Chętnie znajdziemy dla Państwa odpowiednią godzinę.`
        : `\n\nNeem gerust contact met ons op voor een alternatief tijdstip. We helpen graag bij het vinden van een geschikt moment.`);
  
  const closingMessage = isPolish
    ? `Przepraszamy za niedogodności i mamy nadzieję, że wkrótce będziemy mogli Państwa gościć!\n\nZ wyrazami szacunku,\nZespół Greek Irini\n\nWeimarstraat 174, 2562 HD Den Haag\nTel: 0615869325\nEmail: irini070dh@gmail.com`
    : `Onze excuses voor het ongemak en we hopen u binnenkort te mogen verwelkomen!\n\nMet vriendelijke groet,\nTeam Greek Irini\n\nWeimarstraat 174, 2562 HD Den Haag\nTel: 0615869325\nEmail: irini070dh@gmail.com`;

  return {
    to_email: reservation.customerEmail,
    to_name: reservation.customerName,
    subject: isPolish 
      ? `Rezerwacja w Greek Irini - Prośba o kontakt`
      : `Reservering bij Greek Irini - Verzoek tot contact`,
    greeting,
    message: sorryMessage + alternativeMessage,
    closing: closingMessage,
    restaurant_name: 'Greek Irini',
  };
};

// Wysyłanie emaila z potwierdzeniem rezerwacji
export const sendReservationConfirmationEmail = async (
  reservation: Reservation,
  adminNotes: string = '',
  language: Language = 'nl'
): Promise<{ success: boolean; message: string }> => {
  
  if (!isConfigured()) {
    console.log('📧 EmailJS nie skonfigurowany - symulacja wysyłki emaila rezerwacji');
    console.log('📧 Dane emaila:', generateReservationConfirmationEmail(reservation, adminNotes, language));
    
    return {
      success: true,
      message: 'Email potwierdzenia wysłany (tryb demo)',
    };
  }

  try {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    
    const emailData = generateReservationConfirmationEmail(reservation, adminNotes, language);
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      emailData
    );

    console.log('✅ Email potwierdzenia rezerwacji wysłany:', response);
    
    return {
      success: true,
      message: language === 'pl' 
        ? 'Potwierdzenie rezerwacji wysłane na email!' 
        : 'Reserveringsbevestiging verzonden!',
    };
  } catch (error) {
    console.error('❌ Błąd wysyłania emaila rezerwacji:', error);
    
    return {
      success: false,
      message: language === 'pl'
        ? 'Nie udało się wysłać emaila.'
        : 'E-mail kon niet worden verzonden.',
    };
  }
};

// Wysyłanie emaila z odrzuceniem rezerwacji
export const sendReservationRejectionEmail = async (
  reservation: Reservation,
  alternativeTime: string = '',
  language: Language = 'nl'
): Promise<{ success: boolean; message: string }> => {
  
  if (!isConfigured()) {
    console.log('📧 EmailJS nie skonfigurowany - symulacja wysyłki emaila odrzucenia');
    console.log('📧 Dane emaila:', generateReservationRejectionEmail(reservation, alternativeTime, language));
    
    return {
      success: true,
      message: 'Email odrzucenia wysłany (tryb demo)',
    };
  }

  try {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    
    const emailData = generateReservationRejectionEmail(reservation, alternativeTime, language);
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      emailData
    );

    console.log('✅ Email odrzucenia rezerwacji wysłany:', response);
    
    return {
      success: true,
      message: language === 'pl' 
        ? 'Email wysłany!' 
        : 'E-mail verzonden!',
    };
  } catch (error) {
    console.error('❌ Błąd wysyłania emaila:', error);
    
    return {
      success: false,
      message: language === 'pl'
        ? 'Nie udało się wysłać emaila.'
        : 'E-mail kon niet worden verzonden.',
    };
  }
};

export default {
  sendOrderConfirmationEmail,
  generateEmailContent,
  getEmailJSConfig,
  sendReservationConfirmationEmail,
  sendReservationRejectionEmail,
};
