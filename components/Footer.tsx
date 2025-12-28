
import React, { useContext } from 'react';
import { LanguageContext } from '../index';
import { TRANSLATIONS } from '../constants';

const Footer: React.FC = () => {
  const langCtx = useContext(LanguageContext);
  if (!langCtx) return null;
  const t = TRANSLATIONS[langCtx.language];

  return (
    <footer id="contact" className="pt-24 pb-12 bg-gradient-to-b from-blue-50 to-white border-t border-blue-200 overflow-hidden relative">
      {/* Abstract Design Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="text-xl font-serif tracking-widest uppercase text-gray-800">
                Greek <span className="gold-gradient font-bold">Irini</span>
              </span>
            </div>
            <p className="text-gray-600 max-w-sm mb-8 leading-relaxed">
              {t.heroSub}
            </p>
            <div className="flex gap-4">
              {['FB', 'IG', 'TW', 'YT'].map(social => (
                <button key={social} className="w-10 h-10 rounded-full border border-blue-300 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                  <span className="text-[10px] font-bold">{social}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-xl mb-8 tracking-widest uppercase text-gray-800">{t.contact}</h4>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start gap-4">
                <span className="text-blue-600">A:</span>
                <span>Weimarstraat 174, 2562 HD<br/>Den Haag, Holandia</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-blue-600">T:</span>
                <span>+31 (0) 70 555 0123</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-blue-600">E:</span>
                <span>info@greekirini.nl</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-xl mb-8 tracking-widest uppercase text-gray-800">Opening</h4>
            <ul className="space-y-4 text-gray-600">
              <li className="flex justify-between">
                <span>Mon - Thu:</span>
                <span className="text-gray-800">12:00 - 22:00</span>
              </li>
              <li className="flex justify-between">
                <span>Fri - Sat:</span>
                <span className="text-gray-800">12:00 - 00:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-blue-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-xs tracking-widest uppercase">
            &copy; 2025 Greek Irini. All rights reserved.
          </p>
          <div className="flex gap-8 text-gray-500 text-xs tracking-widest uppercase">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Delivery</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
