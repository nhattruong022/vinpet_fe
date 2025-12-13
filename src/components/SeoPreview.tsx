'use client';

interface SeoPreviewProps {
  title: string;
  url: string;
  description: string;
  siteName: string;
}

export default function SeoPreview({ title, url, description, siteName }: SeoPreviewProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Preview trên Google:</h3>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        {/* Google Search Result Preview */}
        <div className="space-y-1">
          {/* Title */}
          <div className="text-blue-600 text-lg leading-tight hover:underline cursor-pointer">
            {title || 'Tiêu đề bài viết...'}
          </div>

          {/* URL */}
          <div className="text-green-700 text-sm">
            {url ? `https://${siteName.toLowerCase()}.com/${url}` : `https://${siteName.toLowerCase()}.com/...`}
          </div>

          {/* Description */}
          <div className="text-gray-600 text-sm leading-relaxed">
            {description || 'Mô tả SEO sẽ hiển thị ở đây...'}
          </div>
        </div>
      </div>

      {/* SEO Tips */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className={`${(title || '').length > 60 ? 'text-red-500' : 'text-green-500'}`}>
          Title: {(title || '').length}/60 ký tự
        </div>
        <div className={`${(description || '').length > 160 ? 'text-red-500' : 'text-green-500'}`}>
          Description: {(description || '').length}/160 ký tự
        </div>
      </div>
    </div>
  );
}
