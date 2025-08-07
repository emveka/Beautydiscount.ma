// components/layout/TopHeader.tsx
import React from 'react';

/**
 * TopHeader - Barre supérieure blanche avec message de livraison
 * Message simple : "Livraison et Paiement à la réception dans tout le Maroc"
 */
const TopHeader: React.FC = () => {
  return (
    <div className="bg-white text-black text-sm py-2 border-b border-gray-200">
      <div className="container mx-auto px-4">
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