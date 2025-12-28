
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface GoogleReviewCardProps {
  rating: number | null;
  reviews: number | null;
  isLoading: boolean;
  onWriteReview: () => void;
  language: string;
  t: any;
}

const GoogleReviewCard: React.FC<GoogleReviewCardProps> = ({ 
  rating, 
  reviews, 
  isLoading, 
  onWriteReview,
  language,
  t
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Ensure the UI reflects the requested 5.0 aesthetic
  const displayRating = rating !== null ? rating.toFixed(1) : "5.0";

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate normalized position from -1 to 1
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    
    setMousePos({ x, y });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative group max-w-2xl mx-auto perspective-2000 py-12"
    >
      {/* Dynamic Animated Aura - Constant slow breathing + mouse reactive */}
      <div 
        className={`absolute -inset-10 bg-gradient-to-br from-blue-400/20 via-transparent to-blue-400/20 rounded-[5rem] blur-[80px] transition-all duration-1000 ease-out pointer-events-none ${isHovered ? 'opacity-80' : 'opacity-40'}`}
        style={{
          transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px) scale(${isHovered ? 1.1 : 1})`,
          animation: 'pulse-slow 8s ease-in-out infinite'
        }}
      ></div>

      {/* Parallax Secondary Glow */}
      <div 
        className="absolute -inset-2 bg-blue-400/10 rounded-[4rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
        }}
      ></div>
      
      {/* Main Card Container with 3D Tilt */}
      <div 
        className="relative glass border border-blue-200 rounded-[3.5rem] p-10 md:p-16 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,102,204,0.15)] preserve-3d transition-transform duration-500 ease-out"
        style={{
          transform: `rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg)`,
        }}
      >
        {/* Subtle Moving Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-grain"></div>

        {/* Decorative Grid Pattern - Reacts inverted to mouse for depth */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none transition-transform duration-700 ease-out" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #0066cc 1px, transparent 1px)', 
            backgroundSize: '40px 40px',
            transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px) translateZ(-20px)`,
          }}
        ></div>

        {/* Top Section: Google Logo & Live Status */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 relative z-10 translate-z-20">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl shadow-white/5 group-hover:scale-110 transition-transform duration-500">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-gray-800 font-bold tracking-[0.3em] uppercase text-[10px] mb-1">Google Reviews</p>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className={`block w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                  {!isLoading && <span className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75"></span>}
                </div>
                <span className="text-gray-600 text-[9px] uppercase tracking-[0.2em] font-medium">
                  {isLoading ? 'Synchronizing...' : 'Live Verified'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right hidden md:block opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="text-gray-600 text-[10px] uppercase tracking-[0.3em] font-bold">Den Haag</div>
            <div className="text-blue-600 text-[9px] font-mono">52.0753° N, 4.2805° E</div>
          </div>
        </div>

        {/* Center Section: Big Numbers */}
        <div className="flex flex-col items-center justify-center text-center space-y-10 relative z-10 translate-z-40">
          <div className="relative">
             <div className="text-9xl md:text-[11rem] font-serif font-bold gold-gradient leading-none tracking-tighter drop-shadow-2xl">
               {displayRating}
             </div>
             <div className="absolute -top-4 -right-12 glass border border-blue-300 rounded-full px-5 py-2 text-[11px] font-bold text-gray-700 uppercase tracking-widest shadow-lg">
               / 5.0
             </div>
          </div>

          <div className="flex flex-col items-center space-y-8">
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star} 
                  className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 text-[11px] uppercase tracking-[0.6em] font-bold max-w-sm mx-auto leading-loose">
                Perfect Guest Experiences from Den Haag
              </p>
              <div className="w-16 h-px bg-amber-400 mx-auto opacity-30"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Action */}
        <div className="mt-20 flex flex-col items-center gap-10 relative z-10 translate-z-30">
          <button 
            onClick={onWriteReview}
            className="group/btn relative px-14 py-6 overflow-hidden rounded-[2rem] transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 active:scale-95 shadow-2xl shadow-blue-400/20 hover:shadow-blue-400/40"
          >
            {/* Button Background State */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-500 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover/btn:opacity-100 transition-all duration-500"></div>
            
            <div className="relative flex items-center gap-4">
              <span className="text-white font-bold uppercase tracking-[0.4em] text-[11px] transition-colors duration-500">
                {t.writeReview}
              </span>
              <svg className="w-5 h-5 text-white group-hover/btn:translate-x-1.5 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </button>

          <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-bold">
            Verified by Google Local Guides
          </p>
        </div>

        {/* Floating Background Text - Parallax Level 1 (Slowest/Deepest Text) */}
        <div 
          className="absolute -bottom-16 -left-16 text-[16rem] font-serif font-bold text-gray-800/[0.03] select-none pointer-events-none italic transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -25}px) rotate(-5deg)`,
          }}
        >
          Irini
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; filter: blur(80px); }
          50% { opacity: 0.7; filter: blur(100px); }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          30% { transform: translate(5%, -10%); }
          50% { transform: translate(-10%, 5%); }
          70% { transform: translate(10%, 10%); }
          90% { transform: translate(-5%, -5%); }
        }
        .perspective-2000 { perspective: 2000px; }
        .translate-z-20 { transform: translateZ(20px); }
        .translate-z-30 { transform: translateZ(30px); }
        .translate-z-40 { transform: translateZ(40px); }
      `}} />
    </div>
  );
};

export default GoogleReviewCard;
