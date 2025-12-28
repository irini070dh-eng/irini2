
import React, { useContext } from 'react';
import { LanguageContext } from '../index';
import { TRANSLATIONS } from '../constants';

const ContactView: React.FC = () => {
  const langCtx = useContext(LanguageContext);
  if (!langCtx) return null;
  const { language } = langCtx;
  const t = TRANSLATIONS[language];

  const fullAddress = "Weimarstraat 174, 2562 HD Den Haag, Netherlands";
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  
  const whatsappNumber = "31705550123";
  const defaultMsg = encodeURIComponent(language === 'pl' ? "Dzień dobry! Piszę ze strony Greek Irini..." : "Hallo! Ik schrijf vanaf de website van Greek Irini...");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMsg}`;

  return (
    <div className="pt-32 pb-24 px-4 bg-gradient-to-b from-white to-blue-50 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 text-gray-800">{t.contactTitle}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">{t.contactSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side: Contact Form */}
          <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-blue-200 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400 opacity-[0.05] blur-3xl group-hover:opacity-[0.12] transition-opacity duration-1000" />
            
            <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-600 ml-2">{t.formName}</label>
                <input type="text" className="w-full bg-white/70 border border-blue-300 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all text-sm text-gray-800" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-600 ml-2">{t.formEmail}</label>
                <input type="email" className="w-full bg-white/70 border border-blue-300 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all text-sm text-gray-800" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-600 ml-2">{t.formMessage}</label>
                <textarea rows={4} className="w-full bg-white/70 border border-blue-300 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all resize-none text-sm text-gray-800" placeholder="..." />
              </div>
              <button className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-400/20">
                {t.formSubmit}
              </button>
            </form>
          </div>

          {/* Right Side: Contact Info & WhatsApp */}
          <div className="space-y-10">
            {/* Premium WhatsApp Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-500/0 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative glass p-10 rounded-[3rem] border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-500 overflow-hidden shadow-2xl">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-emerald-500/15 transition-colors" />
                
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left relative z-10">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-emerald-500/30 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-lg shadow-emerald-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.139c1.52.907 3.391 1.385 5.295 1.386 5.425 0 9.839-4.413 9.842-9.838.001-2.628-1.023-5.1-2.885-6.963-1.862-1.861-4.334-2.885-6.964-2.886-5.424 0-9.838 4.415-9.841 9.839-.002 1.83.475 3.61 1.382 5.168l-1.004 3.666 3.754-.984zm11.035-7.63c-.301-.15-.1.301-.601-.15-1.785-.891-2.094-.891-2.396-.891-.302 0-.528.15-.754.452-.226.302-.867 1.054-1.055 1.279-.19.226-.377.256-.678.105-.302-.15-1.274-.467-2.427-1.493-.897-.802-1.503-1.792-1.679-2.094-.175-.302-.019-.465.132-.615.136-.135.302-.35.452-.525.15-.177.2-.302.302-.502.101-.199.05-.377-.025-.526-.075-.15-.678-1.635-.929-2.24-.244-.59-.492-.51-.678-.52l-.58-.011c-.226 0-.593.085-.904.426-.311.342-1.187 1.161-1.187 2.827 0 1.666 1.214 3.274 1.383 3.501.17.226 2.39 3.65 5.79 5.118.808.348 1.439.555 1.931.713.812.257 1.551.221 2.135.135.652-.099 2.013-.824 2.296-1.62.283-.798.283-1.481.198-1.62-.085-.14-.312-.226-.613-.376z"/>
                    </svg>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-3xl font-serif font-bold text-gray-800 mb-2 group-hover:text-emerald-500 transition-colors">WhatsApp Direct</h4>
                      <p className="text-gray-600 text-sm font-light tracking-wide">
                        {language === 'pl' ? 'Natychmiastowe wsparcie i rezerwacje przez telefon.' : 'Directe ondersteuning en reserveringen via uw mobiel.'}
                      </p>
                    </div>
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-4 px-10 py-5 bg-emerald-500 text-zinc-950 font-bold uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      {language === 'pl' ? 'NAPISZ TERAZ' : 'WHATSAPP NU'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Integration */}
            <div className="aspect-video w-full rounded-[3rem] overflow-hidden glass border border-blue-200 shadow-2xl relative group">
              <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-blue-900/0 transition-colors z-10 pointer-events-none" />
              <iframe 
                title="Location Map" 
                src={mapUrl} 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(1.1) brightness(0.8)' }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="transition-all duration-1000 grayscale-[0.5] group-hover:grayscale-0 group-hover:brightness-100"
              />
              <div className="absolute top-6 left-6 z-20">
                <div className="glass px-6 py-3 rounded-2xl border border-blue-300 shadow-lg">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Weimarstraat 174, Den Haag</span>
                </div>
              </div>
            </div>
            
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="glass p-8 rounded-[2rem] border border-blue-200">
                <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-2">Email Us</p>
                <p className="text-sm text-gray-800 font-medium">info@greekirini.nl</p>
              </div>
              <div className="glass p-8 rounded-[2rem] border border-blue-200">
                <p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold mb-2">Call Us</p>
                <p className="text-sm text-gray-800 font-medium">+31 70 555 0123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactView;
