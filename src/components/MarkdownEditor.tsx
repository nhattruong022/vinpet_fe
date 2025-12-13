'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';

// Dynamic import để tránh lỗi SSR
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung Markdown...',
  label,
  error,
}: MarkdownEditorProps) {
  const [previewMode, setPreviewMode] = useState<'edit' | 'live' | 'preview'>('live');

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Preview Mode Toggle */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setPreviewMode('edit')}
          className={`px-3 py-1 text-xs rounded ${previewMode === 'edit'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Chỉnh sửa
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode('live')}
          className={`px-3 py-1 text-xs rounded ${previewMode === 'live'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Xem trước
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode('preview')}
          className={`px-3 py-1 text-xs rounded ${previewMode === 'preview'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Chỉ xem
        </button>
      </div>

      <div data-color-mode="light" className={error ? 'border border-red-300 rounded-md' : ''}>
        <MDEditor
          value={value}
          onChange={onChange}
          preview={previewMode}
          hideToolbar={false}
          visibleDragbar={previewMode === 'live'}
          height={500}
          data-color-mode="light"
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        💡 Sử dụng Markdown để định dạng nội dung. Bấm "Xem trước" để xem kết quả.
      </p>
    </div>
  );
}

