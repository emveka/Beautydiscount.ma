// components/ClientWrapper.tsx - Version corrigée sans erreur de hooks
'use client'
import React, { useEffect, useState } from 'react';
import TopHeader from "@/components/layout/TopHeader";
import Header from "@/components/layout/Header";
import MenuNavigation from "@/components/layout/MenuNavigation";
import CartDrawer from "@/components/cart/CartDrawer";
import { useCartData } from '@/store/cartStore';

/**
 * Wrapper client pour gérer l'hydratation SSR/CSR avec Zustand
 * Évite les erreurs "getServerSnapshot should be cached"
 * 🆕 Inclut maintenant le CartDrawer global - VERSION CORRIGÉE
 */
const ClientWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ✅ CORRECTION: Appeler les hooks TOUJOURS, pas conditionnellement
  const { isOpen: cartIsOpen } = useCartData();

  // ✅ Attendre l'hydratation complète avant d'afficher les composants utilisant Zustand
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ✅ Synchroniser l'état local avec le store Zustand APRÈS hydratation
  useEffect(() => {
    if (isHydrated) {
      setIsCartOpen(cartIsOpen);
    }
  }, [cartIsOpen, isHydrated]);

  // Fonction pour fermer le cart drawer
  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  // ✅ Pendant l'hydratation, afficher exactement votre version statique existante
  if (!isHydrated) {
    return (
      <>
        {/* Version statique identique à votre projet original */}
        <TopHeader />
        <Header />
        <MenuNavigation />
        <main>
          {children}
        </main>
      </>
    );
  }

  // ✅ Après hydratation, afficher les composants complets avec Zustand + CartDrawer
  return (
    <>
      <TopHeader />
      <Header />
      <MenuNavigation />
      <main>
        {children}
      </main>
      
      {/* 🆕 CartDrawer global - accessible depuis toute l'application */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={handleCloseCart} 
      />
    </>
  );
};

export default ClientWrapper;