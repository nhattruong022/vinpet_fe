'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, CategoryTreeNode } from '@/lib/api';
import SuccessNotification from '@/components/SuccessNotification';
import ImageUpload from '@/components/ImageUpload';
import MarkdownEditor from '@/components/MarkdownEditor';
import { htmlToMarkdown } from '@/lib/utils/htmlToMarkdown';
import { formatMarkdown } from '@/lib/utils/formatMarkdown';

export default function CreateEditPost() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    // Đa ngôn ngữ 
    title_vi: '',
    title_en: '',
    title_ko: '',
    content_vi: '',
    content_en: '',
    content_ko: '',
    description_vi: '',
    description_en: '',
    description_ko: '',
    status: 'draft' as 'published' | 'draft',
    seoTitle: '',
    permalink: '',
    metaDescription: '',
    featuredImageUrl: '',
    canonicalUrl: '',
    breadcrumbTitle: '',
    categoryId: '',
    robotsMeta: {
      index: true,
      nofollow: false,
      noimageindex: false,
      noarchive: false,
      nosnippet: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [images, setImages] = useState<Array<{ url?: string, id?: string, file: File, name: string }>>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<'create' | 'upload'>('create');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const tree = await apiService.getCategoryTree({
        rootOnly: false,
        includeInactive: false,
      });
      setCategories(tree);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Flatten categories for dropdown
  const flattenCategories = (categories: CategoryTreeNode[], level = 0): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    categories.forEach(category => {
      const indent = '  '.repeat(level);
      const prefix = level > 0 ? '└─ ' : '';
      const displayName = category.name || category.name_vi || category.name_en || category.slug || 'Unnamed';
      result.push({
        id: category._id,
        name: `${indent}${prefix}${displayName}`,
        level,
      });
      if (category.children && category.children.length > 0) {
        result.push(...flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('robotsMeta.')) {
      const robotKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        robotsMeta: {
          ...prev.robotsMeta,
          [robotKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Refs để lưu timeout cho debounce
  const formatTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleMarkdownChange = (fieldName: string) => (value: string | undefined) => {
    let markdownValue = value || '';
    const prevValue = formData[fieldName as keyof typeof formData] as string || '';

    // Detect paste: nếu content tăng đột ngột (> 100 ký tự), có thể là paste
    const isLikelyPaste = markdownValue.length - prevValue.length > 100;

    // Lưu giá trị ngay lập tức
    setFormData(prev => ({
      ...prev,
      [fieldName]: markdownValue,
    }));

    // Clear timeout cũ nếu có
    if (formatTimeouts.current[fieldName]) {
      clearTimeout(formatTimeouts.current[fieldName]);
    }

    // Format ngay nếu là paste, hoặc sau 1 giây nếu là gõ thường
    const formatDelay = isLikelyPaste ? 100 : 1000;

    formatTimeouts.current[fieldName] = setTimeout(() => {
      let formattedValue = markdownValue;

      // Nếu value có vẻ là HTML (chứa thẻ HTML), tự động parse về Markdown
      if (formattedValue && /<[a-z][\s\S]*>/i.test(formattedValue)) {
        formattedValue = htmlToMarkdown(formattedValue);
      } else if (formattedValue && formattedValue.length > 50) {
        // Format Markdown cho đúng chuẩn
        formattedValue = formatMarkdown(formattedValue);
      }

      // Cập nhật lại với giá trị đã format
      if (formattedValue !== markdownValue) {
        setFormData(prev => ({
          ...prev,
          [fieldName]: formattedValue,
        }));
      }
    }, formatDelay);

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const handleImagesUploaded = (uploadedImages: Array<{ url?: string, id?: string, file: File, name: string }>) => {
    setImages(uploadedImages);
    // Set the first image as featured image if no featured image is set
    if (uploadedImages.length > 0 && !formData.featuredImageUrl && uploadedImages[0].url) {
      setFormData(prev => ({
        ...prev,
        featuredImageUrl: uploadedImages[0].url!
      }));
    }
  };

  const handleUploadImages = async () => {
    if (!createdPostId) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/admin/posts');
      }, 2000);
      return;
    }

    setIsUploadingImages(true);
    
    try {
      // Upload all images first
      const uploadedImages = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const response = await apiService.uploadMedia(image.file, createdPostId, i);
        uploadedImages.push({
          url: response.url || `/uploads/media/${response.filename}`,
          id: response.id,
          position: i
        });
      }

      // Update post with uploaded images
      const updateData = {
        images: uploadedImages,
        featuredImageUrl: uploadedImages[0]?.url || ''
      };
      
      await apiService.updatePost(createdPostId, updateData);
      
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/admin/posts');
      }, 2000);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Có lỗi xảy ra khi upload hình ảnh');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSkipImages = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/admin/posts');
    }, 2000);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validation theo API: Cần ít nhất một title và một content (có thể khác ngôn ngữ)
    const hasTitle = !!(formData.title_vi?.trim() || formData.title_en?.trim() || formData.title_ko?.trim() || formData.title?.trim());
    const hasContent = !!(formData.content_vi?.trim() || formData.content_en?.trim() || formData.content_ko?.trim() || formData.content?.trim());

    if (!hasTitle) {
      newErrors.title_vi = 'Vui lòng nhập ít nhất một tiêu đề (tiếng Việt, tiếng Anh hoặc tiếng Hàn)';
    }

    if (!hasContent) {
      newErrors.content_vi = 'Vui lòng nhập ít nhất một nội dung (tiếng Việt, tiếng Anh hoặc tiếng Hàn)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const postData = {
        ...formData,
        tags: [],
        author: '68cc1c99d4b84384037ccd1b', // Current user ID
        categories: formData.categoryId ? [formData.categoryId] : [],
        // Remove images from initial post creation
      };
      
      console.log('Post data:', postData);
      
      // Call API to create post first
      const response = await apiService.createPost(postData);
      setCreatedPostId(response._id);
      setUploadStep('upload');
      
      // Don't show success yet, wait for image upload
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Có lỗi xảy ra khi tạo bài viết');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tạo bài viết mới</h1>
              <p className="text-gray-600 mt-2">Tạo và xuất bản bài viết mới cho website VINPET</p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại
            </button>
          </div>
        </div>



        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${uploadStep === 'create' ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${uploadStep === 'create' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {uploadStep === 'create' ? '1' : '✓'}
              </div>
              <span className="ml-2 text-sm font-medium">Tạo bài viết</span>
            </div>
            
            <div className={`w-12 h-0.5 ${uploadStep === 'upload' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${uploadStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${uploadStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Upload hình ảnh</span>
            </div>
          </div>
        </div>

        {uploadStep === 'create' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Đa ngôn ngữ */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Nội dung đa ngôn ngữ</h2>
                  <p className="text-sm text-gray-500 mt-1">Nhập nội dung cho các ngôn ngữ: Tiếng Việt, Tiếng Anh, Tiếng Hàn</p>
            </div>
            <div className="p-6 space-y-6">
                  {/* Title đa ngôn ngữ */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-800">Tiêu đề *</h3>
                    {errors.title_vi && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{errors.title_vi}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4">
              <div>
                        <label htmlFor="title_vi" className="block text-sm font-medium text-gray-700 mb-2">
                          Tiêu đề (Tiếng Việt)
                </label>
                <input
                  type="text"
                          id="title_vi"
                          name="title_vi"
                          value={formData.title_vi}
                  onChange={handleInputChange}
                          className={`block w-full px-3 py-2 border ${errors.title_vi ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
                          placeholder="Nhập tiêu đề tiếng Việt..."
                        />
                      </div>
                      <div>
                        <label htmlFor="title_en" className="block text-sm font-medium text-gray-700 mb-2">
                          Title (English)
                        </label>
                        <input
                          type="text"
                          id="title_en"
                          name="title_en"
                          value={formData.title_en}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter title in English..."
                        />
                      </div>
                      <div>
                        <label htmlFor="title_ko" className="block text-sm font-medium text-gray-700 mb-2">
                          제목 (한국어)
                        </label>
                        <input
                          type="text"
                          id="title_ko"
                          name="title_ko"
                          value={formData.title_ko}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                          placeholder="한국어 제목을 입력하세요..."
                        />
                      </div>
                    </div>
              </div>

                  {/* Description đa ngôn ngữ */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-800">Mô tả</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="description_vi" className="block text-sm font-medium text-gray-700 mb-2">
                          Mô tả (Tiếng Việt)
                        </label>
                        <textarea
                          id="description_vi"
                          name="description_vi"
                          rows={4}
                          value={formData.description_vi}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                          placeholder="Nhập mô tả tiếng Việt..."
                        />
                      </div>
              <div>
                        <label htmlFor="description_en" className="block text-sm font-medium text-gray-700 mb-2">
                          Description (English)
                </label>
                <textarea
                          id="description_en"
                          name="description_en"
                          rows={4}
                          value={formData.description_en}
                  onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter description in English..."
                        />
              </div>
              <div>
                        <label htmlFor="description_ko" className="block text-sm font-medium text-gray-700 mb-2">
                          설명 (한국어)
                </label>
                <textarea
                          id="description_ko"
                          name="description_ko"
                          rows={4}
                          value={formData.description_ko}
                  onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                          placeholder="한국어 설명을 입력하세요..."
                        />
                      </div>
                    </div>
              </div>

                  {/* Content đa ngôn ngữ */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-800">Nội dung * (Markdown format)</h3>
                    {errors.content_vi && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{errors.content_vi}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <MarkdownEditor
                          value={formData.content_vi}
                          onChange={handleMarkdownChange('content_vi')}
                          label="Nội dung (Tiếng Việt) - Markdown"
                          placeholder="Nhập nội dung tiếng Việt (Markdown format)..."
                          error={errors.content_vi}
                        />
                      </div>
                      <div>
                        <MarkdownEditor
                          value={formData.content_en}
                          onChange={handleMarkdownChange('content_en')}
                          label="Content (English) - Markdown"
                          placeholder="Enter content in English (Markdown format)..."
                          error={errors.content_en}
                        />
                      </div>
              <div>
                        <MarkdownEditor
                          value={formData.content_ko}
                          onChange={handleMarkdownChange('content_ko')}
                          label="내용 (한국어) - Markdown"
                          placeholder="한국어 내용을 입력하세요 (Markdown 형식)..."
                          error={errors.content_ko}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Trạng thái</h2>
                </div>
                <div className="p-6">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái bài viết
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đã xuất bản</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Cài đặt SEO</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* SEO Title */}
              <div>
                <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  id="seoTitle"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Tiêu đề SEO cho bài viết..."
                />
              </div>

              {/* Permalink */}
              <div>
                <label htmlFor="permalink" className="block text-sm font-medium text-gray-700 mb-2">
                  Permalink
                </label>
                <input
                  type="text"
                  id="permalink"
                  name="permalink"
                  value={formData.permalink}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="duong-dan-bai-viet"
                />
                <p className="mt-1 text-sm text-gray-500">URL thân thiện cho bài viết</p>
              </div>

              {/* Meta Description */}
              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  rows={3}
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Mô tả meta cho SEO..."
                />
              </div>

              {/* Canonical URL */}
              <div>
                <label htmlFor="canonicalUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Canonical URL
                </label>
                <input
                  type="url"
                  id="canonicalUrl"
                  name="canonicalUrl"
                  value={formData.canonicalUrl}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://vinpet.com/..."
                />
              </div>

              {/* Breadcrumb Title */}
              <div>
                <label htmlFor="breadcrumbTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Breadcrumb Title
                </label>
                <input
                  type="text"
                  id="breadcrumbTitle"
                  name="breadcrumbTitle"
                  value={formData.breadcrumbTitle}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Tiêu đề breadcrumb..."
                />
              </div>
            </div>
          </div>

          {/* Media */}

          {/* Robots Meta */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Robots Meta</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="robotsMeta.index"
                    checked={formData.robotsMeta.index}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Index</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="robotsMeta.nofollow"
                    checked={formData.robotsMeta.nofollow}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">No Follow</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="robotsMeta.noimageindex"
                    checked={formData.robotsMeta.noimageindex}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">No Image Index</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="robotsMeta.noarchive"
                    checked={formData.robotsMeta.noarchive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">No Archive</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="robotsMeta.nosnippet"
                    checked={formData.robotsMeta.nosnippet}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">No Snippet</span>
                </label>
              </div>
            </div>
          </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang tạo...' : 'Tạo bài viết'}
              </button>
            </div>
          </form>
        ) : (
          /* Upload Images Step */
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Bài viết đã được tạo thành công!
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    Bây giờ bạn có thể upload hình ảnh cho bài viết hoặc bỏ qua bước này.
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Upload hình ảnh</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Thêm hình ảnh cho bài viết. Hình đầu tiên sẽ được sử dụng làm hình ảnh chính.
                </p>
              </div>
              <div className="p-6">
                <ImageUpload
                  onImagesUploaded={handleImagesUploaded}
                  currentImages={images}
                  label="Hình ảnh bài viết"
                  multiple={true}
                  postId={createdPostId || undefined}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setUploadStep('create')}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Quay lại
              </button>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleSkipImages}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={handleUploadImages}
                  disabled={isUploadingImages}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImages ? 'Đang cập nhật...' : 'Hoàn thành'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
    {/* Success Notification */}
    <SuccessNotification
      isVisible={showSuccess}
      title="Tạo bài viết thành công!"
      message=""
      onClose={() => setShowSuccess(false)}
      autoClose={true}
      autoCloseDelay={2000}
    />
  </>
);
}