'use client'
// components/home/Banner.tsx - Version Image Simple
import React from 'react';
import Image from 'next/image';

const Banner: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-2 md:px-4 py-2 md:py-6">
        {/* Container avec aspect ratio comme dans votre image */}
        <div className="relative w-full aspect-[16/6] bg-gray-200 rounded-lg md:rounded-2xl overflow-hidden shadow-lg">
          
          {/* Image uniquement */}
          <Image
            src="/bannersalvatore.webp"
            alt="SALVATORE Professional Cosmetics - Lissage TANINO"
            fill
            className="object-cover"
            priority={true}
            quality={90}
            sizes="(max-width: 768px) 100vw, 1400px"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==" 
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;