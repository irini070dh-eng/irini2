
import React, { useContext } from 'react';
import { LanguageContext, SettingsContext } from '../index';
import { TRANSLATIONS } from '../constants';

const Footer: React.FC = () => {
  const langCtx = useContext(LanguageContext);
  const settingsCtx = useContext(SettingsContext);
  if (!langCtx || !settingsCtx) return null;
  const t = TRANSLATIONS[langCtx.language];
  const { settings } = settingsCtx;

  return (
    <footer id="contact" className="pt-24 pb-12 bg-gradient-to-b from-blue-50 to-white border-t border-blue-200 overflow-hidden relative">
      {/* Abstract Design Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden p-1">
                <img src="/logo.jpeg" alt="Greek Irini" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-serif tracking-widest uppercase text-gray-800">
                Greek <span className="blue-gradient font-bold">Irini</span>
              </span>
            </div>
            <p className="text-gray-600 max-w-sm mb-8 leading-relaxed">
              {t.heroSub}
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-xl mb-8 tracking-widest uppercase text-gray-800">{t.contact}</h4>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start gap-4">
                <span className="text-blue-600">A:</span>
                <span>{settings.address}, {settings.postalCode}<br/>{settings.city}, Nederland</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-blue-600">T:</span>
                <span>0615869325</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-blue-600">E:</span>
                <span>irini070dh@gmail.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-xl mb-8 tracking-widest uppercase text-gray-800">Opening</h4>
            <ul className="space-y-4 text-gray-600">
              {Object.entries(settings.openingHours).slice(0, 2).map(([day, hours]) => {
                const h = hours as { open: string; close: string; closed?: boolean };
                return !h.closed ? (
                  <li key={day} className="flex justify-between capitalize">
                    <span>{day}:</span>
                    <span className="text-gray-800">{h.open} - {h.close}</span>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-blue-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-xs tracking-widest uppercase">
            &copy; 2025 {settings.name}. All rights reserved.
          </p>
          <div className="flex gap-8 text-gray-500 text-xs tracking-widest uppercase">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Delivery</a>
            <a href="#admin" className="hover:text-blue-600 transition-colors">Staff Portal</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
