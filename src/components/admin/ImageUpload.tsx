// components/admin/ImageUpload.tsx
'use client'
import React, { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Upload, X, Star, Image as ImageIcon, Loader } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  images: string[];
  mainImage: string;
  onImagesChange: (images: string[]) => void;
  onMainImageChange: (mainImage: string) => void;
  productName?: string;
}

interface UploadingImage {
  id: string;
  file: File;
  progress: number;
  preview: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  mainImage,
  onImagesChange,
  onMainImageChange,
  productName = 'product'
}) => {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Générer un nom de fichier unique
  const generateFileName = (file: File) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const cleanProductName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `products/${cleanProductName}/${timestamp}-${randomId}.${extension}`;
  };

  // Upload d'un fichier vers Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = generateFileName(file);
    const storageRef = ref(storage, fileName);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    }
  };

  // Supprimer une image de Firebase Storage
  const deleteImage = async (imageUrl: string) => {
    try {
      // Extraire le chemin depuis l'URL Firebase
      const decodedUrl = decodeURIComponent(imageUrl);
      const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        const imagePath = pathMatch[1];
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  // Gérer les fichiers sélectionnés
  const handleFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB max
    );

    if (validFiles.length === 0) {
      alert('Veuillez sélectionner des images valides (max 5MB)');
      return;
    }

    // Créer les previews et états d'upload
    const newUploadingImages: UploadingImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 15),
      file,
      progress: 0,
      preview: URL.createObjectURL(file)
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // Upload en parallèle
    const uploadPromises = newUploadingImages.map(async (uploadingImage) => {
      try {
        const downloadURL = await uploadImage(uploadingImage.file);
        
        // Mettre à jour la liste des images
        onImagesChange([...images, downloadURL]);
        
        // Si c'est la première image, la définir comme principale
        if (images.length === 0 && !mainImage) {
          onMainImageChange(downloadURL);
        }
        
        return downloadURL;
      } catch (error) {
        console.error('Erreur upload image:', error);
        alert(`Erreur lors de l'upload de ${uploadingImage.file.name}`);
        return null;
      } finally {
        // Supprimer de la liste des uploads
        setUploadingImages(prev => prev.filter(img => img.id !== uploadingImage.id));
        // Nettoyer l'URL de preview
        URL.revokeObjectURL(uploadingImage.preview);
      }
    });

    await Promise.all(uploadPromises);
  }, [images, mainImage, onImagesChange, onMainImageChange]);

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Supprimer une image
  const removeImage = async (imageUrl: string) => {
    if (confirm('Supprimer cette image ?')) {
      try {
        await deleteImage(imageUrl);
        const newImages = images.filter(img => img !== imageUrl);
        onImagesChange(newImages);
        
        // Si c'était l'image principale, choisir une nouvelle
        if (mainImage === imageUrl && newImages.length > 0) {
          onMainImageChange(newImages[0]);
        } else if (mainImage === imageUrl) {
          onMainImageChange('');
        }
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Définir comme image principale
  const setMainImage = (imageUrl: string) => {
    onMainImageChange(imageUrl);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Images du produit
      </label>

      {/* Zone de drop */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-pink-500 bg-pink-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-pink-600">Cliquez pour choisir</span> ou 
              glissez-déposez vos images
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP jusqu&apos;à 5MB chacune
            </p>
          </div>
        </div>
      </div>

      {/* Images en cours d'upload */}
      {uploadingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {uploadingImages.map((uploadingImage) => (
            <div key={uploadingImage.id} className="relative">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={uploadingImage.preview}
                  alt="Upload en cours"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0  flex items-center justify-center">
                  <Loader className="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-1">
                <div className="text-xs text-center font-medium">Upload...</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Images uploadées */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Images ({images.length})
            </h4>
            <div className="text-xs text-gray-500">
              ⭐ = Image principale
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-pink-300 transition-colors">
                  <Image
                    src={imageUrl}
                    alt={`Produit ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Actions overlay */}
                <div className="absolute inset-0  group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <button
                      onClick={() => setMainImage(imageUrl)}
                      className={`p-2 rounded-full transition-colors ${
                        mainImage === imageUrl
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-yellow-100'
                      }`}
                      title={mainImage === imageUrl ? 'Image principale' : 'Définir comme principale'}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeImage(imageUrl)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badge image principale */}
                {mainImage === imageUrl && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Principale
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune image */}
      {images.length === 0 && uploadingImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm">Aucune image ajoutée</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;