
import React, { useContext, useState, useRef, useCallback } from 'react';
import { LanguageContext, SiteContentContext } from '../index';
import { TRANSLATIONS } from '../constants';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  signature: string;
}

const TeamCard: React.FC<{ member: TeamMember; index: number }> = ({ member, index }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Normalized position from -1 to 1
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    
    // Increase tilt intensity for "more pronounced" effect
    setTilt({ x: x * 12, y: y * -12 });

    // Calculate glare position in percentage
    const glareX = ((e.clientX - rect.left) / rect.width) * 100;
    const glareY = ((e.clientY - rect.top) / rect.height) * 100;
    setGlare({ x: glareX, y: glareY, opacity: 1 });
  }, []);

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative perspective-2000 opacity-0 animate-reveal stagger-${(index % 3) + 1}`}
    >
      <div 
        className="relative preserve-3d transition-all duration-500 ease-out glass rounded-[3.5rem] p-8 border border-blue-200 hover:border-blue-400 hover:scale-[1.03] hover:shadow-[0_60px_120px_-30px_rgba(0,102,204,0.2)] overflow-hidden"
        style={{ transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
      >
        {/* Dynamic Glare/Spotlight Effect */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: glare.opacity * 0.15,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, white, transparent 60%)`,
          }}
        />

        {/* Background Signature Decor */}
        <div className="absolute top-10 right-10 text-8xl font-serif italic text-gray-800/[0.03] select-none pointer-events-none group-hover:text-blue-600/[0.06] transition-colors duration-700">
          {member.signature}
        </div>

        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] mb-8 translate-z-40">
          <img 
            src={member.image} 
            alt={member.name} 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-110"
          />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent opacity-60" />
          
          {/* Enhanced Hover Bio Overlay */}
          <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out pointer-events-none group-hover:pointer-events-auto">
             <div className="w-full glass p-6 rounded-[2rem] border border-white/20 backdrop-blur-2xl translate-y-12 group-hover:translate-y-0 transition-all duration-1000 bg-black/40 shadow-2xl">
                <div className="w-10 h-0.5 bg-gradient-to-r from-blue-600 to-blue-700 mb-4 opacity-50 rounded-full" />
                <p className="text-white text-sm md:text-xs xl:text-sm leading-relaxed font-medium tracking-tight">
                  {member.bio}
                </p>
             </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="space-y-3 translate-z-60 text-center md:text-left px-2">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="w-8 h-px bg-blue-600 opacity-30" />
            <span className="text-blue-600 uppercase tracking-[0.5em] text-[9px] font-bold">
              {member.role}
            </span>
          </div>
          <h3 className="text-4xl font-serif font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-500">
            {member.name}
          </h3>
          
          <div className="pt-6 flex justify-center md:justify-start gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
             {['IN', 'IG'].map(social => (
               <span key={social} className="text-[10px] font-bold tracking-widest text-gray-500 hover:text-blue-600 cursor-pointer transition-colors uppercase">
                 {social}
               </span>
             ))}
          </div>
        </div>

        {/* Corner Decor */}
        <div className="absolute -bottom-2 -right-2 w-16 h-16 border-r-2 border-b-2 border-blue-400/0 group-hover:border-blue-400/30 rounded-br-[3.5rem] transition-all duration-700" />
      </div>
    </div>
  );
};

const AboutView: React.FC = () => {
  const langCtx = useContext(LanguageContext);
  const siteCtx = useContext(SiteContentContext);
  if (!langCtx) return null;
  const { language } = langCtx;
  const t = TRANSLATIONS[language];

  // Get team member images and bios from database, with fallbacks
  const getTeamImage = (member: string) => {
    const dbImage = siteCtx?.getImageUrl('about', `team_${member.toLowerCase()}`, '');
    const fallbacks: Record<string, string> = {
      irini: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&q=80&w=800',
      nikolas: 'https://images.unsplash.com/photo-1583394293214-28dea15ee548?auto=format&fit=crop&q=80&w=800',
      eleni: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=800'
    };
    return dbImage || fallbacks[member.toLowerCase()] || '';
  };

  const getTeamBio = (member: string, defaultPl: string, defaultNl: string) => {
    const dbBio = siteCtx?.getText('about', `team_${member.toLowerCase()}_bio`, language, '');
    return dbBio || (language === 'pl' ? defaultPl : defaultNl);
  };

  const team: TeamMember[] = [
    {
      name: siteCtx?.getText('about', 'team_irini_name', language, 'Irini Papadopoulos') || 'Irini Papadopoulos',
      role: t.founderLabel,
      image: getTeamImage('irini'),
      signature: "Irini",
      bio: getTeamBio('irini',
        "Założycielka i serce Greek Irini. Wychowana w Sparcie, przeniosła miłość do autentyczności na ulice Hagi, dbając o każdy detal gościnności.",
        "Founder and heart of Greek Irini. Raised in Sparta, she brought a love for authenticity to the streets of Den Haag, attending to every detail of hospitality."
      )
    },
    {
      name: siteCtx?.getText('about', 'team_nikolas_name', language, 'Nikolas Katsaros') || 'Nikolas Katsaros',
      role: t.chefLabel,
      image: getTeamImage('nikolas'),
      signature: "Nikolas",
      bio: getTeamBio('nikolas',
        "Mistrz ognia i tradycji. Nikolas łączy rodzinne przepisy z nowoczesną precyzją, tworząc dania, które opowiadają historię Morza Egejskiego.",
        "Master of fire and tradition. Nikolas blends family recipes with modern precision, creating dishes that tell the story of the Aegean Sea."
      )
    },
    {
      name: siteCtx?.getText('about', 'team_eleni_name', language, 'Eleni Vlachos') || 'Eleni Vlachos',
      role: t.serviceLabel,
      image: getTeamImage('eleni'),
      signature: "Eleni",
      bio: getTeamBio('eleni',
        "Twarz naszej gościnności. Eleni dba o to, by 'Philoxenia' była odczuwalna przy każdym stoliku, tworząc atmosferę prawdziwego greckiego domu.",
        "The face of our hospitality. Eleni ensures that 'Philoxenia' is felt at every table, creating the atmosphere of a true Greek home."
      )
    }
  ];

  const pillars = [
    { title: t.philosophyPillar1Title, text: t.philosophyPillar1Text, icon: "/Onze Filosofie (1).png" },
    { title: t.philosophyPillar2Title, text: t.philosophyPillar2Text, icon: "/Onze Filosofie (2).png" },
    { title: t.philosophyPillar3Title, text: t.philosophyPillar3Text, icon: "/Onze Filosofie (3).png" }
  ];

  return (
    <div className="bg-gradient-to-b from-white to-blue-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center pt-20">
        <div className="absolute inset-0">
          <img 
            src={siteCtx?.getImageUrl('about', 'hero_background', 'https://images.unsplash.com/photo-1533103133182-018764028304?auto=format&fit=crop&q=80&w=1920') || 'https://images.unsplash.com/photo-1533103133182-018764028304?auto=format&fit=crop&q=80&w=1920'} 
            alt="Greek Island Atmosphere" 
            className="w-full h-full object-cover opacity-40 grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-transparent to-white" />
        </div>
        
        <div className="relative z-10 text-center px-4 animate-reveal">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-px bg-blue-600 opacity-50" />
            <span className="text-blue-600 uppercase tracking-[0.8em] text-[10px] font-bold block">{t.aboutUs}</span>
            <div className="w-12 h-px bg-blue-600 opacity-50" />
          </div>
          <h1 className="text-7xl md:text-9xl font-serif font-bold mb-8 leading-none text-gray-800">{t.aboutHeroTitle}</h1>
          <p className="text-gray-600 text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed italic opacity-90">
            "{t.aboutHeroSub}"
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-32 px-4 relative bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 animate-reveal">
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full border border-blue-400/30 glass">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">Since 1984 in The Hague</span>
            </div>
            <h2 className="text-6xl font-serif font-bold leading-tight text-gray-800">
              {t.ourStoryTitle} <br/>
              <span className="blue-gradient italic">In Den Haag</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed font-light first-letter:text-5xl first-letter:font-serif first-letter:text-blue-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
              {t.ourStoryText}
            </p>
          </div>

          <div className="relative group animate-reveal stagger-2">
            <div className="absolute -inset-10 bg-blue-400/10 blur-[120px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative overflow-hidden rounded-[4rem] border border-blue-200 shadow-2xl">
              <img 
                src={siteCtx?.getImageUrl('about', 'story_image', '/galeria (2).png') || '/galeria (2).png'} 
                alt="Greek Irini Restaurant" 
                className="w-full h-auto object-contain transition-transform duration-[10s] group-hover:scale-105"
              />
            </div>
            <div className="mt-8 text-center px-4">
              <p className="text-gray-800 font-serif italic text-xl md:text-2xl">"Food is not just sustenance; it is a conversation between history and the plate."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-48 px-4 relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none select-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="greekPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0 50 L25 50 L25 25 L75 25 L75 75 L100 75" fill="none" stroke="#0066cc" strokeWidth="2" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#greekPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-12 animate-reveal">
              <div className="space-y-6">
                <span className="text-blue-600 uppercase tracking-[0.6em] text-[10px] font-bold block">{t.philosophyTitle}</span>
                <h2 className="text-6xl md:text-8xl font-serif font-bold leading-none text-gray-800">{t.philosophySub}</h2>
              </div>
              <p className="text-gray-600 text-xl leading-relaxed font-light italic">
                {t.philosophyText}
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 gap-8">
              {pillars.map((pillar, i) => (
                <div 
                  key={i} 
                  className={`group relative glass rounded-[3rem] p-10 border border-blue-200 hover:border-blue-400 transition-all duration-700 animate-reveal stagger-${i+2}`}
                >
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-blue-300 group-hover:border-blue-500 group-hover:shadow-[0_0_30px_rgba(0,102,204,0.2)] transition-all flex-shrink-0">
                      <img src={pillar.icon} alt="Philosophy" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-3xl font-serif font-bold blue-gradient">{pillar.title}</h3>
                      <p className="text-gray-600 leading-relaxed font-light">{pillar.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section Expanded */}
      <section className="py-48 px-4 relative bg-white">
        {/* Decorative background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32 space-y-6">
            <div className="inline-flex flex-col items-center">
              <span className="text-blue-600 uppercase tracking-[1em] text-[10px] font-bold block mb-4">{t.teamTitle}</span>
              <h2 className="text-7xl md:text-9xl font-serif font-bold text-gray-800">{t.teamSub}</h2>
              <div className="w-24 h-1 bg-blue-600 mt-8 opacity-30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-8 xl:gap-16">
            {team.map((member, i) => (
              <TeamCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Atmospheric Gallery Grid */}
      <section className="py-48 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-12 gap-8 auto-rows-auto">
             <div className="col-span-12 lg:col-span-8 overflow-hidden rounded-[4rem] relative group">
                <img src={siteCtx?.getImageUrl('gallery', 'image_1', '/galeria.png') || '/galeria.png'} alt="Restaurant Greek Irini" className="w-full h-auto object-contain transition-transform duration-[10s] group-hover:scale-110" />
                <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
             <div className="col-span-6 lg:col-span-4 overflow-hidden rounded-[4rem] relative group">
                <img src={siteCtx?.getImageUrl('gallery', 'image_2', '/galeria (1).png') || '/galeria (1).png'} alt="Greek Irini Interior" className="w-full h-auto object-contain transition-transform duration-[10s] group-hover:scale-110" />
             </div>
             <div className="col-span-6 lg:col-span-4 overflow-hidden rounded-[4rem] relative group">
                <img src={siteCtx?.getImageUrl('gallery', 'image_3', '/galeria4.png') || '/galeria4.png'} alt="Greek Irini Atmosphere" className="w-full h-auto object-contain transition-transform duration-[10s] group-hover:scale-110" />
             </div>
             <div className="col-span-12 lg:col-span-8 overflow-hidden rounded-[4rem] relative group">
                <img src={siteCtx?.getImageUrl('gallery', 'image_4', '/galeria (3).png') || '/galeria (3).png'} alt="Greek Irini Restaurant" className="w-full h-auto object-contain transition-transform duration-[10s] group-hover:scale-110" />
             </div>
           </div>
        </div>
      </section>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .translate-z-20 { transform: translateZ(20px); }
        .translate-z-30 { transform: translateZ(30px); }
        .translate-z-40 { transform: translateZ(40px); }
        .translate-z-60 { transform: translateZ(60px); }
        .perspective-2000 { perspective: 2000px; }
        .preserve-3d { transform-style: preserve-3d; }
      `}} />
    </div>
  );
};

export default AboutView;
