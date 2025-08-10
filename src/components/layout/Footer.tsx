// components/layout/Footer.tsx - Version simple et compacte
'use client'
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Heart
} from 'lucide-react';

/**
 * Footer simple et compact pour BeautyDiscount.ma
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Section principale compacte */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Colonne 1 : Logo + Description */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/bdlogo.png"
                alt="BeautyDiscount.ma"
                width={150}
                height={38}
                className="h-10 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-gray-300 text-sm">
              Cosmétiques et parfums de qualité à prix discount au Maroc.
            </p>
            
            {/* Réseaux sociaux */}
            <div className="flex space-x-3">
              <a
                href="https://facebook.com/beautydiscount.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/beautydiscount.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors duration-200"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/212662185335"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Colonne 2 : Liens rapides */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/a-propos" className="text-gray-300 hover:text-pink-400 transition-colors">
                  À Propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Nous Contacter
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-pink-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/conseils-beaute" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Conseils Beauté
                </Link>
              </li>
              <li>
                <Link href="/suivi-commande" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Suivi Commande
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Service Client */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Service Client</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="w-4 h-4 text-pink-400" />
                <div>
                  <a href="tel:0662185335" className="hover:text-white transition-colors block">
                    06 62 18 53 35
                  </a>
                  <a href="tel:0669881999" className="hover:text-white transition-colors block">
                    06 69 88 19 99
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="w-4 h-4 text-pink-400" />
                <a href="mailto:contact@beautydiscount.ma" className="hover:text-white transition-colors">
                  contact@beautydiscount.ma
                </a>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="w-4 h-4 text-pink-400" />
                <span>Casablanca, Maroc</span>
              </div>
            </div>
          </div>

          {/* Colonne 4 : Informations légales */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Informations</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/conditions-generales" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link href="/retours-echanges" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Retours & Échanges
                </Link>
              </li>
            </ul>

            {/* WhatsApp compact */}
            <div className="mt-4">
              <a
                href="https://wa.me/212662185335?text=Bonjour, j'ai besoin d'aide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs transition-colors duration-200"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom compact */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} BeautyDiscount.ma - Tous droits réservés
              </p>
            </div>

            {/* Badges de confiance */}
            <div className="flex justify-center md:justify-end items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Paiement sécurisé</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Livraison rapide</span>
              </span>
              <span className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-pink-400" />
                <span>Made in Morocco</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;