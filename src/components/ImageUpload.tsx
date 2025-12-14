'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageItem {
  url?: string;  // Preview URL (temporary)
  id?: string;   // Will be set after upload
  file: File;    // Actual file to upload
  name: string;  // File name for display
  altText?: string; // Alt text for image
}

interface ContentStructure {
  totalParagraphs: number;
  availablePositions: number[];
}

interface ImageUploadProps {
  onImagesUploaded: (images: ImageItem[]) => void;
  currentImages?: ImageItem[];
  label?: string;
  multiple?: boolean;
  postId?: string;
  contentStructure?: ContentStructure | null;
  imagePositions?: Record<number, number>;
  onPositionChange?: (imageIndex: number, position: number) => void;
  content?: string; // Markdown content for preview
}

export default function ImageUpload({
  onImagesUploaded,
  currentImages = [],
  label = "Hình ảnh",
  multiple = true,
  contentStructure,
  imagePositions = {},
  onPositionChange,
  content = ''
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageItem[]>(currentImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string; index: number } | null>(null);
  const [pendingImages, setPendingImages] = useState<Array<{ file: File; url: string; name: string }>>([]);
  const [positionSelection, setPositionSelection] = useState<{ imageIndex: number; position: number; altText: string } | null>(null);

  // Update images when currentImages changes
  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);

  // Keyboard navigation for preview modal
  useEffect(() => {
    if (!previewImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        const prevIndex = previewImage.index > 0 ? previewImage.index - 1 : images.length - 1;
        setPreviewImage({ url: images[prevIndex].url || '', name: images[prevIndex].name, index: prevIndex });
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        const nextIndex = previewImage.index < images.length - 1 ? previewImage.index + 1 : 0;
        setPreviewImage({ url: images[nextIndex].url || '', name: images[nextIndex].name, index: nextIndex });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, images]);

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

    // Create preview images and show position selection modal
    const newPendingImages: Array<{ file: File; url: string; name: string }> = [];

    for (const file of fileArray) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      newPendingImages.push({
        file: file,
        url: previewUrl,
        name: file.name
      });
    }

    // Show position selection for first image
    setPendingImages(newPendingImages);
    setPositionSelection({
      imageIndex: 0,
      position: images.length === 0 ? 0 : (contentStructure?.availablePositions.find(p => p > 0) || 1),
      altText: '' // Initialize alt text as empty
    });

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmPosition = () => {
    if (!positionSelection || pendingImages.length === 0) return;

    const currentIndex = positionSelection.imageIndex;
    const selectedPosition = positionSelection.position;
    const altText = positionSelection.altText || '';
    const currentImage = pendingImages[currentIndex];

    // Create image item
    const newImage: ImageItem = {
      url: currentImage.url,
      file: currentImage.file,
      name: currentImage.name,
      altText: altText
    };

    // Determine the actual index in the images array
    const actualIndex = images.length;

    // Add image to list
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    onImagesUploaded(updatedImages);

    // Set position for this image
    if (onPositionChange) {
      onPositionChange(actualIndex, selectedPosition);
    }

    // If there are more images to process, show next one
    if (currentIndex < pendingImages.length - 1) {
      setPositionSelection({
        imageIndex: currentIndex + 1,
        position: contentStructure?.availablePositions.find(p => p > 0) || (actualIndex + 1),
        altText: '' // Reset alt text for next image
      });
    } else {
      // All images processed, close modal
      setPendingImages([]);
      setPositionSelection(null);
    }
  };

  const handleCancelPosition = () => {
    // Clean up object URLs
    pendingImages.forEach(img => {
      URL.revokeObjectURL(img.url);
    });
    setPendingImages([]);
    setPositionSelection(null);
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
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const fakeEvent = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
            handleFileSelect(fakeEvent);
          }
        }}
      >
        {images.length > 0 ? (
          <div className="space-y-4">
            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={image.name} className="relative group">
                  <div className="relative cursor-pointer" onClick={() => setPreviewImage({ url: image.url || '', name: image.name, index })}>
                    <img
                      src={image.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    />

                    {/* Position Badge */}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {index + 1}
                    </div>

                    {/* Preview Icon */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
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
                  <div className="mt-2 space-y-2">
                    {index === 0 ? (
                      <div className="space-y-1">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 font-medium">Vị trí 0</p>
                          <p className="text-xs text-blue-600 font-medium">(Hình ảnh chính)</p>
                        </div>
                        {image.altText && (
                          <div className="mt-1">
                            <p className="text-xs text-gray-500">Alt: {image.altText}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-xs text-gray-600 font-medium mb-1">
                          Chọn vị trí chèn ảnh:
                        </label>
                        <select
                          value={imagePositions[index] !== undefined ? imagePositions[index] : index}
                          onChange={(e) => {
                            const position = parseInt(e.target.value);
                            onPositionChange?.(index, position);
                          }}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          {contentStructure?.availablePositions
                            .filter(pos => pos !== 0) // Exclude position 0 (thumbnail)
                            .map(pos => (
                              <option key={pos} value={pos}>
                                Vị trí {pos} - Sau đoạn văn {pos}
                              </option>
                            ))}
                          {(!contentStructure || contentStructure.availablePositions.length === 0) && (
                            <option value={index}>Vị trí {index} (Mặc định)</option>
                          )}
                        </select>
                        <p className="text-xs text-gray-500 text-center mt-1">
                          <span className="font-medium text-blue-600">
                            Position: {imagePositions[index] !== undefined ? imagePositions[index] : index}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 text-center">
                          Ảnh sẽ được chèn sau đoạn văn {imagePositions[index] !== undefined ? imagePositions[index] : index}
                        </p>
                        {image.altText && (
                          <div className="mt-1 pt-1 border-t border-gray-200">
                            <p className="text-xs text-gray-500">Alt: {image.altText}</p>
                          </div>
                        )}
                      </div>
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
                  disabled={false}
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
                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-400'
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

      {/* Position Selection Modal */}
      {positionSelection !== null && pendingImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={handleCancelPosition}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Chọn vị trí cho ảnh {positionSelection.imageIndex + 1} / {pendingImages.length}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {pendingImages[positionSelection.imageIndex].name}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Preview */}
              <div className="flex justify-center">
                <img
                  src={pendingImages[positionSelection.imageIndex].url}
                  alt={pendingImages[positionSelection.imageIndex].name}
                  className="max-w-full max-h-48 rounded-lg shadow-md"
                />
              </div>

              {/* Position Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn vị trí chèn ảnh:
                </label>
                <select
                  value={positionSelection.position}
                  onChange={(e) => {
                    setPositionSelection({
                      ...positionSelection,
                      position: parseInt(e.target.value)
                    });
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  {images.length === 0 && (
                    <option value={0}>Vị trí 0 - Hình ảnh chính (Thumbnail)</option>
                  )}
                  {contentStructure?.availablePositions
                    .filter(pos => pos !== 0 || images.length === 0)
                    .map(pos => (
                      <option key={pos} value={pos}>
                        {pos === 0
                          ? 'Vị trí 0 - Hình ảnh chính (Thumbnail)'
                          : `Vị trí ${pos} - Sau đoạn văn ${pos}`}
                      </option>
                    ))}
                  {(!contentStructure || contentStructure.availablePositions.length === 0) && (
                    <option value={images.length === 0 ? 0 : images.length}>
                      {images.length === 0
                        ? 'Vị trí 0 - Hình ảnh chính (Mặc định)'
                        : `Vị trí ${images.length} - Mặc định`}
                    </option>
                  )}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {positionSelection.position === 0
                    ? 'Ảnh này sẽ được sử dụng làm hình ảnh chính của bài viết'
                    : `Ảnh này sẽ được chèn sau đoạn văn thứ ${positionSelection.position} trong nội dung`}
                </p>
              </div>

              {/* Alt Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text (Mô tả ảnh) <span className="text-gray-400 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={positionSelection.altText}
                  onChange={(e) => {
                    setPositionSelection({
                      ...positionSelection,
                      altText: e.target.value
                    });
                  }}
                  placeholder="Nhập mô tả cho ảnh (giúp SEO và accessibility)..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Alt text giúp mô tả nội dung ảnh cho SEO và người dùng khiếm thị. Nên mô tả ngắn gọn, rõ ràng.
                </p>
                {positionSelection.altText && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Đã nhập: {positionSelection.altText.length} ký tự
                  </p>
                )}
              </div>

              {/* Content Preview */}
              {content && positionSelection.position > 0 && (() => {
                // Parse content into paragraphs
                const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
                const selectedPosition = positionSelection.position;
                const prevParagraphIndex = selectedPosition - 1;
                const nextParagraphIndex = selectedPosition;

                // Simple markdown rendering
                const renderText = (text: string) => {
                  let html = text;
                  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
                  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
                  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
                  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
                  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
                  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');
                  html = html.replace(/\n/g, '<br />');
                  return html;
                };

                return (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Preview: Ảnh sẽ được chèn ở đây
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
                      {/* Previous paragraph */}
                      {prevParagraphIndex >= 0 && prevParagraphIndex < paragraphs.length && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">
                            Đoạn văn {prevParagraphIndex + 1}:
                          </div>
                          <div
                            className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded border border-gray-200"
                            dangerouslySetInnerHTML={{ __html: renderText(paragraphs[prevParagraphIndex]) }}
                          />
                        </div>
                      )}

                      {/* Image insertion point */}
                      <div className="relative">
                        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-500 rounded"></div>
                        <div className="bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg p-4">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <img
                              src={pendingImages[positionSelection.imageIndex].url}
                              alt={pendingImages[positionSelection.imageIndex].name}
                              className="max-w-full max-h-48 rounded-lg shadow-md"
                            />
                            <div className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">
                              ⬇ Ảnh sẽ được chèn ở đây (Sau đoạn {selectedPosition}) ⬇
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Next paragraph */}
                      {nextParagraphIndex < paragraphs.length && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">
                            Đoạn văn {nextParagraphIndex + 1}:
                          </div>
                          <div
                            className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded border border-gray-200"
                            dangerouslySetInnerHTML={{ __html: renderText(paragraphs[nextParagraphIndex]) }}
                          />
                        </div>
                      )}

                      {nextParagraphIndex >= paragraphs.length && (
                        <div className="text-xs text-gray-500 italic text-center py-2">
                          (Sau đoạn văn cuối cùng)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Thumbnail preview */}
              {positionSelection.position === 0 && content && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Preview: Hình ảnh chính
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-3">
                      <img
                        src={pendingImages[positionSelection.imageIndex].url}
                        alt={pendingImages[positionSelection.imageIndex].name}
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                      <div className="text-xs text-center text-blue-700 bg-blue-100 px-3 py-2 rounded">
                        Ảnh này sẽ hiển thị ở đầu bài viết như hình ảnh chính (thumbnail)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelPosition}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmPosition}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {positionSelection.imageIndex < pendingImages.length - 1 ? 'Tiếp theo' : 'Hoàn thành'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="text-white">
                  <p className="font-medium text-sm">{previewImage.name}</p>
                  <p className="text-xs mt-1">
                    Ảnh {previewImage.index + 1} / {images.length}
                    {previewImage.index === 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 rounded">Hình chính</span>
                    )}
                    {previewImage.index > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-600 rounded">
                        Vị trí: {imagePositions[previewImage.index] !== undefined ? imagePositions[previewImage.index] : previewImage.index}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const prevIndex = previewImage.index > 0 ? previewImage.index - 1 : images.length - 1;
                    setPreviewImage({ url: images[prevIndex].url || '', name: images[prevIndex].name, index: prevIndex });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextIndex = previewImage.index < images.length - 1 ? previewImage.index + 1 : 0;
                    setPreviewImage({ url: images[nextIndex].url || '', name: images[nextIndex].name, index: nextIndex });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
