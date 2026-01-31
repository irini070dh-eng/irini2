
import React, { useContext } from 'react';
import { LanguageContext, SiteContentContext } from '../index';
import { TRANSLATIONS } from '../constants';
import { View } from '../types';

interface HeroProps {
  onOrderClick: () => void;
  onAboutClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOrderClick, onAboutClick }) => {
  const langCtx = useContext(LanguageContext);
  const siteCtx = useContext(SiteContentContext);
  if (!langCtx) return null;
  const t = TRANSLATIONS[langCtx.language];

  // Get hero background from site content or fallback to default
  const heroBackground = siteCtx?.getImageUrl('home', 'hero_background', '/okładka strony home.png') || '/okładka strony home.png';
  const heroBadge = siteCtx?.getText('home', 'hero_badge', langCtx.language, 'Authentic Greek Kitchen') || 'Authentic Greek Kitchen';

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroBackground} 
          alt="Authentic Greek Food"
          className="w-full h-full object-cover opacity-70 scale-105 transition-transform duration-[20s] ease-out group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-8 inline-flex items-center gap-3 px-6 py-3 rounded-full border border-blue-400/40 glass backdrop-blur-xl shadow-[0_0_30px_-5px_rgba(0,102,204,0.4)]">
          <span className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-blue-500 to-blue-600 animate-pulse shadow-[0_0_10px_rgba(0,102,204,0.6)]" />
          <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-blue-400">Authentic Greek Kitchen</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold mb-10 leading-[0.9] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {t.heroTitle.split(' ').map((word, i) => (
            <span key={i} className={i === 1 ? 'blue-gradient block sm:inline' : 'text-white block sm:inline mr-4 rtl:ml-4'}>
              {word}{' '}
            </span>
          ))}
        </h1>

        <p className="text-lg md:text-xl text-white mb-10 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {t.heroSub}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={onOrderClick}
            className="group relative px-14 py-6 bg-linear-to-r from-blue-600 to-blue-700 overflow-hidden rounded-full transition-all duration-300 hover:scale-[1.08] active:scale-95 shadow-[0_8px_40px_-10px_rgba(0,102,204,0.6)] hover:shadow-[0_12px_50px_-10px_rgba(0,102,204,0.8)]"
          >
            <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative text-white font-bold uppercase tracking-[0.3em] text-[11px]">{t.orderNow}</span>
          </button>
          
          <button 
            onClick={onAboutClick}
            className="px-14 py-6 rounded-full border-2 border-white/40 hover:border-white/70 glass backdrop-blur-xl transition-all uppercase tracking-[0.3em] text-[11px] font-semibold text-white hover:bg-white/10"
          >
            {t.aboutUs}
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-70">
        <div className="w-7 h-12 border-2 border-white/50 rounded-full flex justify-center pt-2.5 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          <div className="w-1.5 h-3 bg-linear-to-b from-blue-500 to-blue-600 rounded-full shadow-[0_0_8px_rgba(0,102,204,0.6)]" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
