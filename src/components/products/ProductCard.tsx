// components/product/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';

/**
 * Interface définissant les propriétés du composant ProductCard
 * Toutes les données nécessaires pour afficher un produit
 */
interface ProductCardProps {
  imageUrl: string;      // URL de l'image du produit
  brand: string;         // Marque du produit
  name: string;          // Nom du produit
  price: number;         // Prix actuel du produit
  originalPrice: number; // Prix original (avant réduction)
  discount: number;      // Montant de la réduction en DH
  slug: string;          // Slug pour l'URL du produit
  inStock: boolean;      // Disponibilité du produit
}

/**
 * ProductCard - Version Simple
 * Affiche un produit avec image, informations de base et prix
 * Sans bouton d'ajout au panier
 */
export default function ProductCard({
  imageUrl,
  brand,
  name,
  price,
  originalPrice,
  discount,
  slug,
  inStock
}: ProductCardProps) {
  return (
    <div className="w-full max-w-xs bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative group">
      
      {/* Bandeau de réduction - Affiché seulement s'il y a une réduction */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded z-10">
          -{discount.toLocaleString()} DH
        </div>
      )}

      {/* Badge rupture de stock */}
      {!inStock && (
        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded z-10">
          Rupture
        </div>
      )}

      {/* Container de l'image avec effet hover - Optimisé pour 1080x1080 */}
      <div className="relative overflow-hidden aspect-square">
        <Image
          src={imageUrl}
          alt={name}
          width={1080}
          height={1080}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          priority={false}
        />
        
        {/* Overlay sur l'image au hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
      </div>

      {/* Section des détails du produit */}
      <div className="p-4">
        {/* Marque du produit */}
        <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1">
          {brand}
        </p>
        
        {/* Nom du produit avec lien */}
        <Link 
          href={`/products/${slug}`} 
          className="block font-medium text-gray-800 text-sm hover:text-pink-600 transition-colors duration-200 leading-5 mb-2"
        >
          {/* Truncature du nom si trop long */}
          {name.length > 45 ? `${name.slice(0, 45)}...` : name}
        </Link>

        {/* Section des prix */}
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-2">
            {/* Prix actuel */}
            <span className="text-lg font-bold text-pink-600">
              {price.toLocaleString()} DH
            </span>
            
            {/* Prix original barré si différent du prix actuel */}
            {originalPrice > price && (
              <span className="text-sm line-through text-gray-400">
                {originalPrice.toLocaleString()} DH
              </span>
            )}
          </div>
          
          {/* Indicateur de stock */}
          <div className="text-xs">
            {inStock ? (
              <span className="text-green-600 font-medium">En stock</span>
            ) : (
              <span className="text-red-500 font-medium">Épuisé</span>
            )}
          </div>
        </div>
        
        {/* Calcul et affichage du pourcentage de réduction */}
        {originalPrice > price && (
          <div className="mt-2">
            <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
              -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}