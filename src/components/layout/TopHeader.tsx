// components/layout/TopHeader.tsx - Version Mobile Optimisée
import React from 'react';

/**
 * TopHeader - Barre supérieure mobile-optimisée
 * 🚀 Mobile: Texte plus petit et compact
 * 🖥️ Desktop: Taille normale
 */
const TopHeader: React.FC = () => {
  return (
    <div className="bg-white text-black text-xs sm:text-sm py-1 sm:py-2 border-b border-gray-200">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="text-center">
          <span className="font-medium">
            Livraison et Paiement à la réception dans tout le Maroc
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;