
import React, { useContext, useState, useEffect, useRef } from 'react';
import { LanguageContext, CartContext } from '../index';
import { TRANSLATIONS, MENU_ITEMS } from '../constants';

const Menu: React.FC = () => {
  const langCtx = useContext(LanguageContext);
  const cartCtx = useContext(CartContext);
  const [activeCategory, setActiveCategory] = useState<keyof typeof TRANSLATIONS.nl.categories>('mains');
  const [displayItems, setDisplayItems] = useState(MENU_ITEMS.filter(item => item.category === 'mains'));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!langCtx || !cartCtx) return null;
  const { language } = langCtx;
  const t = TRANSLATIONS[language];

  const categories = Object.keys(t.categories) as (keyof typeof t.categories)[];

  useEffect(() => {
    // Prevent initial blink
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle category change with high-end 400ms transition
  const handleCategoryChange = (cat: keyof typeof t.categories) => {
    if (cat === activeCategory || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Smooth scroll for mobile users if they are deep in the menu
    const rect = scrollRef.current?.getBoundingClientRect();
    if (rect && rect.top < 0) {
      window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'smooth' });
    }

    // Phase 1: Fade out current items (400ms)
    setTimeout(() => {
      // Phase 2: Switch data
      setActiveCategory(cat);
      setDisplayItems(MENU_ITEMS.filter(item => item.category === cat));
      
      // Shortest possible delay to ensure React has rendered the new items 
      // before we start the fade-in phase
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 400); 
  };

  return (
    <section id="menu" ref={scrollRef} className="py-24 px-4 bg-gradient-to-b from-blue-50 to-white relative min-h-screen">
      {/* Background radial gradient for depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(0,102,204,0.1)_0%,_transparent_70%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-24 gap-12">
          <div className="space-y-6 max-w-2xl animate-reveal">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-blue-600/50" />
              <span className="text-blue-600 uppercase tracking-[0.6em] text-[10px] font-bold">
                {t.familyBusiness}
              </span>
            </div>
            <h2 className="text-6xl md:text-8xl font-serif font-bold leading-none text-gray-800">
              {t.ourMenu.split(' ').map((word, i) => (
                <span key={i} className={i === 0 ? "" : "gold-gradient italic ml-4"}>{word} </span>
              ))}
            </h2>
            <p className="text-gray-600 leading-relaxed text-xl font-light">
              {t.authenticDesc}
            </p>
          </div>
          
          {/* Category Navigation */}
          <div className="flex flex-wrap gap-4 animate-reveal stagger-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`relative px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-400 overflow-hidden group/cat ${
                  activeCategory === cat 
                  ? 'text-white scale-[1.08] shadow-[0_20px_40px_-15px_rgba(0,102,204,0.4)]' 
                  : 'text-gray-600 hover:text-gray-800 glass border border-blue-200 hover:scale-105'
                }`}
              >
                {/* Active Background Slide */}
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transition-transform duration-500 ease-out ${activeCategory === cat ? 'translate-y-0' : 'translate-y-full'}`} />
                
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/cat:opacity-100 transition-opacity" />
                
                <span className="relative z-10">{t.categories[cat]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Grid with Premium 400ms Transitions */}
        <div 
          key={activeCategory} // Key ensures the whole grid's reveal animations re-trigger after fade-in
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 transition-all duration-400 ease-out ${
            isTransitioning ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'
          }`}
        >
          {displayItems.map((item, index) => (
            <div 
              key={item.id} 
              className={`group relative glass rounded-[3rem] overflow-hidden border border-blue-200 hover:border-blue-400 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,102,204,0.3)] opacity-0 animate-reveal stagger-${(index % 6) + 1}`}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.names[language]} 
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-blue-900/10 to-transparent opacity-80" />
                
                {/* Price floating badge */}
                <div className="absolute top-8 right-8 z-20">
                  <div className="glass border border-white/20 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl">
                    <span className="text-blue-600 font-bold tracking-tight text-lg">€{item.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-10 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl font-serif font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {item.names[language]}
                  </h3>
                  <p className="text-gray-200 text-sm line-clamp-2 font-light leading-relaxed mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {item.descriptions[language]}
                  </p>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      cartCtx.addToCart(item.id);
                    }}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 duration-500 delay-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.addToCart}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Menu;
