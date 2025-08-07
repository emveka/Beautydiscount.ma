'use client'
// components/home/Banner.tsx - VERSION OPTIMISÉE LCP
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSlide {
  id: number;
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  alt: string;
}

const Banner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 🔧 OPTIMISATION 1: Une seule image responsive
  const slides: BannerSlide[] = [
    {
      id: 1,
      image: '/bannersalvatore.webp', // ← Une seule image, optimisée
      title: 'Nouvelle Collection Maquillage',
      description: 'Découvrez nos dernières tendances beauté avec des prix exceptionnels',
      buttonText: 'Découvrir',
      buttonLink: '/maquillage',
      alt: 'Collection maquillage BeautyDiscount'
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentSlide, slides.length]);

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-2 md:px-4 py-2 md:py-6">
        {/* 🔧 OPTIMISATION 2: Hauteur fixe évite Layout Shift */}
        <div 
          className="relative w-full aspect-[16/9] md:aspect-[16/7] bg-gray-200 rounded-lg md:rounded-2xl overflow-hidden shadow-lg"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* 🔧 OPTIMISATION 3: Image unique et optimisée */}
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                className="object-cover"
                // 🚀 OPTIMISATIONS CRITIQUES POUR LCP
                priority={index === 0}           // ← Charge en priorité
                quality={85}                     // ← Compression optimisée
                sizes="(max-width: 768px) 100vw, 1400px"  // ← Sizes précis
                placeholder="blur"               // ← Placeholder pendant chargement
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==" 
              />
              
              {/* 🔧 OPTIMISATION 4: Contenu en overlay léger */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent">
                <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-white max-w-md">
                  <h2 className="text-lg md:text-3xl font-bold mb-2 drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-base mb-4 opacity-90 drop-shadow">
                    {slide.description}
                  </p>
                  <a
                    href={slide.buttonLink}
                    className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base shadow-lg"
                  >
                    {slide.buttonText}
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation - Affichage conditionnel */}
          {slides.length > 1 && (
            <>
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

              {/* Indicateurs */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;