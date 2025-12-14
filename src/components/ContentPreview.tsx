'use client';

import React from 'react';

interface ImageItem {
  url?: string;
  id?: string;
  file: File;
  name: string;
}

interface ContentPreviewProps {
  content: string; // Markdown content
  images: ImageItem[];
  imagePositions: Record<number, number>;
  locale: 'vi' | 'en' | 'ko';
}

export default function ContentPreview({ content, images, imagePositions, locale }: ContentPreviewProps) {
  // Parse markdown content into paragraphs
  const parseContent = () => {
    if (!content) return [];

    // Split by double newlines to get paragraphs
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    return paragraphs;
  };

  // Get images sorted by position
  const getImagesByPosition = () => {
    const imagesByPos: Record<number, ImageItem[]> = {};

    images.forEach((image, index) => {
      const position = index === 0 ? 0 : (imagePositions[index] !== undefined ? imagePositions[index] : index);
      if (!imagesByPos[position]) {
        imagesByPos[position] = [];
      }
      imagesByPos[position].push(image);
    });

    return imagesByPos;
  };

  const paragraphs = parseContent();
  const imagesByPos = getImagesByPosition();
  const thumbnailImage = imagesByPos[0]?.[0]; // First image at position 0

  // Render markdown paragraph (simple rendering)
  const renderParagraph = (text: string) => {
    // Simple markdown rendering
    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Preview nội dung ({locale.toUpperCase()})
      </h3>

      <div className="prose max-w-none">
        {/* Thumbnail Image */}
        {thumbnailImage && (
          <div className="mb-6">
            <div className="relative">
              <img
                src={thumbnailImage.url}
                alt={thumbnailImage.name}
                className="w-full h-auto rounded-lg shadow-md"
              />
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                Hình ảnh chính (Position 0)
              </div>
            </div>
          </div>
        )}

        {/* Content with images */}
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => {
            const paragraphIndex = index + 1; // Position starts from 1
            const imagesAtPosition = imagesByPos[paragraphIndex] || [];

            return (
              <div key={index} className="space-y-4">
                {/* Paragraph */}
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderParagraph(paragraph) }}
                />

                {/* Images at this position */}
                {imagesAtPosition.length > 0 && (
                  <div className="space-y-3 my-6">
                    {imagesAtPosition.map((image, imgIdx) => (
                      <div key={imgIdx} className="relative">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                          Position {paragraphIndex} - Sau đoạn {paragraphIndex}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 italic text-center">
                          {image.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Images at positions beyond content */}
        {Object.keys(imagesByPos)
          .map(posStr => parseInt(posStr))
          .filter(pos => pos > paragraphs.length && pos !== 0)
          .map(pos => {
            const imagesAtPos = imagesByPos[pos];
            return (
              <div key={pos} className="mt-6 space-y-3">
                <div className="text-sm text-gray-500 mb-2">
                  Ảnh ở vị trí {pos} (sau đoạn cuối cùng)
                </div>
                {imagesAtPos.map((image, imgIdx) => (
                  <div key={imgIdx} className="relative">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                    <div className="absolute top-2 left-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                      Position {pos}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}

