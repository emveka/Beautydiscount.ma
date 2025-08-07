'use client'
// components/home/Banner.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Interface pour les données de banner
 */
interface BannerSlide {
  id: number;
  image: string;
  mobileImage?: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  alt: string;
}

/**
 * Banner - Carrousel d'images avec défilement automatique
 * Format: Adaptatif - même image pour toutes les tailles d'écran
 * Mobile: 200px de hauteur avec recadrage intelligent
 * Desktop: 435px de hauteur 
 * Fonctionnalités: Navigation manuelle, défilement auto, indicateurs
 */
const Banner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Données des slides adaptées pour BeautyDiscount
  const slides: BannerSlide[] = [
    {
      id: 1,
      image: '/bannersalvatore.webp',
      mobileImage: '/banner1.webp',
      title: 'Nouvelle Collection Maquillage',
      description: 'Découvrez nos dernières tendances beauté avec des prix exceptionnels',
      buttonText: 'Découvrir',
      buttonLink: '/maquillage',
      alt: 'Collection maquillage BeautyDiscount'
    },
    
  ];

  // Navigation vers le slide suivant
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Navigation vers le slide précédent
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Navigation directe vers un slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Défilement automatique
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change de slide toutes les 5 secondes

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentSlide]);

  // Pause le défilement automatique au hover (desktop seulement)
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  // Reprend le défilement automatique
  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-2 md:px-4 py-2 md:py-6">
        <div 
          className="relative w-full h-[200px] md:h-[435px] bg-white rounded-lg md:rounded-2xl overflow-hidden shadow-lg"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Container des slides */}
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={slide.id} className="relative w-full h-full flex-shrink-0">
                {/* Image de fond - Desktop */}
                <div className="hidden md:block relative w-full h-full">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 1420px"
                  />
                </div>

                {/* Image de fond - Mobile */}
                <div className="block md:hidden relative w-full h-full">
                  <Image
                    src={slide.mobileImage || slide.image}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Boutons de navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 group"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-200" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 group"
            aria-label="Slide suivant"
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Indicateurs de slides */}
          <div className="absolute bottom-2 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white scale-125 shadow-lg'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;