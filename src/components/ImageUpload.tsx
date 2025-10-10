    'use client';

import { useState, useRef } from 'react';
import { apiService } from '@/lib/api';

interface ImageItem {
  url?: string;  // Preview URL (temporary)
  id?: string;   // Will be set after upload
  file: File;    // Actual file to upload
  name: string;  // File name for display
}

interface ImageUploadProps {
  onImagesUploaded: (images: ImageItem[]) => void;
  currentImages?: ImageItem[];
  label?: string;
  multiple?: boolean;
  postId?: string; // Add postId prop
}

export default function ImageUpload({ onImagesUploaded, currentImages = [], label = "Hình ảnh", multiple = true, postId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [images, setImages] = useState<ImageItem[]>(currentImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate file types
    const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file sizes (5MB max each)
    const oversizedFiles = fileArray.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Một số file quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
      return;
    }

    // If not multiple, replace existing images
    if (!multiple) {
      setImages([]);
    }

    // Create preview images (not upload yet)
    const newImages: ImageItem[] = [];
    
    for (const file of fileArray) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      const newImage: ImageItem = {
        url: previewUrl,
        file: file,
        name: file.name
      };
      
      newImages.push(newImage);
    }

    // Update images state
    const updatedImages = multiple ? [...images, ...newImages] : newImages;
    setImages(updatedImages);
    onImagesUploaded(updatedImages);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (imageName: string) => {
    const updatedImages = images.filter(img => img.name !== imageName);
    setImages(updatedImages);
    onImagesUploaded(updatedImages);
  };

  const handleRemoveAllImages = () => {
    setImages([]);
    onImagesUploaded([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMoveImage = (imageName: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.name === imageName);
    if (currentIndex === -1) return;

    const newImages = [...images];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Swap positions
    [newImages[currentIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[currentIndex]];

    setImages(newImages);
    onImagesUploaded(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {images.length > 0 && (
          <button
            type="button"
            onClick={handleRemoveAllImages}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Xóa tất cả
          </button>
        )}
      </div>
      
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {images.length > 0 ? (
          <div className="space-y-4">
            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={image.name} className="relative group">
                  <div className="relative">
                    <img
                      src={image.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-sm"
                    />
                    
                    {/* Position Badge */}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {index + 1}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.name)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    
                    {/* Move Buttons */}
                    <div className="absolute bottom-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(image.name, 'up')}
                        disabled={index === 0}
                        className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Di chuyển lên"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(image.name, 'down')}
                        disabled={index === images.length - 1}
                        className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Di chuyển xuống"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  
                  {/* Image Info */}
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-600 font-medium">Vị trí {index + 1}</p>
                    {index === 0 && (
                      <p className="text-xs text-blue-600 font-medium">(Hình ảnh chính)</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add More Button */}
            {multiple && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Thêm hình ảnh
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            {/* Upload Text */}
            <div>
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Nhấp để chọn hình ảnh
                </button>
                {' '}hoặc kéo thả vào đây
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF tối đa 5MB {multiple ? '(có thể chọn nhiều file)' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Images Count and Position Info */}
      {images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Đã chọn {images.length} hình ảnh</span>
            </div>
            <div className="text-xs text-gray-500">
              Hình đầu tiên sẽ là hình ảnh chính
            </div>
          </div>
          
          {/* Position Summary */}
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div key={image.name} className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-blue-600' : 'bg-gray-400'
                }`}></div>
                <span className="text-xs text-gray-600">
                  {index + 1}
                  {index === 0 && <span className="text-blue-600 font-medium"> (chính)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
