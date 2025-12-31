
import React, { useContext, useState } from 'react';
import { LanguageContext, CartContext, MenuContext } from '../index';
import { TRANSLATIONS } from '../constants';
import { DELIVERY_CONFIG } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const langCtx = useContext(LanguageContext);
  const cartCtx = useContext(CartContext);
  const menuCtx = useContext(MenuContext);

  if (!langCtx || !cartCtx || !menuCtx) return null;
  const { language, isRTL } = langCtx;
  const t = TRANSLATIONS[language];

  const cartDetails = cartCtx.cart.map(item => {
    const menuInfo = menuCtx.menuItems.find(m => m.id === item.id);
    return menuInfo ? { ...menuInfo, quantity: item.quantity } : null;
  }).filter(Boolean);

  const total = cartDetails.reduce((sum, item) => sum + (item?.price || 0) * (item?.quantity || 0), 0);
  const isBelowMinimum = total < DELIVERY_CONFIG.minOrderAmount && total > 0;
  const amountToFreeDelivery = DELIVERY_CONFIG.freeDeliveryFrom - total;

  const handleCheckout = () => {
    if (isBelowMinimum) {
      return;
    }
    onCheckout();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-blue-900/30 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed top-0 bottom-0 z-[70] w-full max-w-md glass border-l border-blue-200 shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')} ${isRTL ? 'left-0 border-r border-l-0' : 'right-0'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-blue-200 flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-gray-800">{t.cart}</h2>
            <button 
              onClick={onClose} 
              title="Close cart"
              aria-label="Close cart"
              className="p-2 hover:bg-blue-100 rounded-full transition-colors text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartDetails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <svg className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>{t.emptyCart}</p>
              </div>
            ) : (
              cartDetails.map((item) => item && (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-blue-200">
                    <img src={item.image} alt={item.names[language]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-serif font-bold text-lg group-hover:text-blue-600 transition-colors text-gray-800">{item.names[language]}</h4>
                      <span className="font-bold text-sm text-gray-800">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-blue-300 rounded-full px-2 py-1">
                        <button onClick={() => cartCtx.updateQuantity(item.id, -1)} className="p-1 hover:text-blue-600 transition-colors text-lg text-gray-700">-</button>
                        <span className="px-3 font-mono font-bold text-sm text-gray-800">{item.quantity}</span>
                        <button onClick={() => cartCtx.updateQuantity(item.id, 1)} className="p-1 hover:text-blue-600 transition-colors text-lg text-gray-700">+</button>
                      </div>
                      <button 
                        onClick={() => cartCtx.removeFromCart(item.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors text-sm"
                      >
                        {language === 'pl' ? 'Usuń' : 'Verwijder'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartDetails.length > 0 && (
            <div className="p-8 border-t border-zinc-800 bg-zinc-900/50">
              {/* Free delivery progress bar */}
              {total > 0 && amountToFreeDelivery > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-zinc-400 mb-2">
                    <span>{t.freeDeliveryFrom}</span>
                    <span className="text-gold-400">+€{amountToFreeDelivery.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-500"
                      style={{ width: `${Math.min(100, (total / DELIVERY_CONFIG.freeDeliveryFrom) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Minimum order warning */}
              {isBelowMinimum && (
                <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center">
                  {t.minOrderAmount}
                </div>
              )}

              <div className="flex justify-between items-end mb-8">
                <span className="text-zinc-500 uppercase tracking-widest text-xs font-bold">{t.subtotal}</span>
                <span className="text-3xl font-serif font-bold blue-gradient">€{total.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={isBelowMinimum}
                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm transition-all shadow-xl ${
                  isBelowMinimum 
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:scale-[1.02] active:scale-95 shadow-blue-400/20'
                }`}
              >
                {t.checkout}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
