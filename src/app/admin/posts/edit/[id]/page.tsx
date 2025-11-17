'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiService } from '@/lib/api';
import SuccessNotification from '@/components/SuccessNotification';
import SeoPreview from '@/components/SeoPreview';
import ImageUpload from '@/components/ImageUpload';

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft' as 'published' | 'draft',
    seoTitle: '',
    permalink: '',
    metaDescription: '',
    featuredImageUrl: '',
    canonicalUrl: '',
    breadcrumbTitle: '',
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
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [images, setImages] = useState<Array<{url?: string, id?: string, file: File, name: string}>>([]);
  const [seoPreview, setSeoPreview] = useState({
    title: '',
    url: '',
    description: '',
    siteName: 'Vinpet'
  });
  const [editStep, setEditStep] = useState<'edit' | 'images'>('edit');
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const loadPost = useCallback(async () => {
    try {
      const post = await apiService.getPost(postId);
      
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status,
        seoTitle: post.seoTitle,
        permalink: post.permalink,
        metaDescription: post.metaDescription,
        featuredImageUrl: post.featuredImageUrl,
        canonicalUrl: post.canonicalUrl,
        breadcrumbTitle: post.breadcrumbTitle,
        robotsMeta: post.robotsMeta
      });

      // Set SEO preview
      setSeoPreview({
        title: post.seoTitle,
        url: post.permalink,
        description: post.metaDescription,
        siteName: 'Vinpet'
      });

      // Load existing images if any
      if (post.images && post.images.length > 0) {
        const existingImages = post.images.map((img, index: number) => ({
          url: img.url || img.image || '', // Use url or image (base64) or empty string
          id: img.id,
          name: `existing-image-${index}`,
          file: new File([], `existing-image-${index}`) // Placeholder file
        }));
        setImages(existingImages);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      alert('Không thể tải bài viết');
    } finally {
      setIsLoadingPost(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadPost();
  }, [router, postId, loadPost]);

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
    
    // Update SEO preview
    if (name === 'seoTitle' || name === 'permalink' || name === 'metaDescription') {
      setSeoPreview(prev => ({
        ...prev,
        [name === 'seoTitle' ? 'title' : name === 'permalink' ? 'url' : 'description']: value
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

  const handleImagesUploaded = (uploadedImages: Array<{url?: string, id?: string, file: File, name: string}>) => {
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
    setIsUploadingImages(true);
    
    try {
      // Upload new images (filter out existing ones)
      const newImages = images.filter(img => img.file.size > 0); // Only files with actual content
      const uploadedImages = [];
      
      for (let i = 0; i < newImages.length; i++) {
        const image = newImages[i];
        const response = await apiService.uploadMedia(image.file, postId, i);
        uploadedImages.push({
          url: response.url || `/uploads/media/${response.filename}`,
          id: response.id,
          position: i
        });
      }

      // Combine existing and new images
      const existingImages = images.filter(img => img.file.size === 0); // Existing images
      const allImages = [...existingImages.map(img => ({ url: img.url!, id: img.id!, position: 0 })), ...uploadedImages];

      // Update post with all images
      const updateData = {
        images: allImages,
        featuredImageUrl: images[0]?.url || ''
      };
      
      await apiService.updatePost(postId, updateData);
      
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
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung là bắt buộc';
    }
    
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Mô tả ngắn là bắt buộc';
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
        // Keep existing categories from post
      };
      
      console.log('Update post data:', postData);
      
      // Call API to update post
      await apiService.updatePost(postId, postData);
      
      // Move to images step
      setEditStep('images');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Có lỗi xảy ra khi cập nhật bài viết');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bài viết</h1>
              <p className="text-gray-600 mt-2">Chỉnh sửa và cập nhật bài viết</p>
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
            <div className={`flex items-center ${editStep === 'edit' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                editStep === 'edit' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {editStep === 'edit' ? '1' : '✓'}
              </div>
              <span className="ml-2 text-sm font-medium">Chỉnh sửa bài viết</span>
            </div>
            
            <div className={`w-12 h-0.5 ${editStep === 'images' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${editStep === 'images' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                editStep === 'images' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Chỉnh sửa hình ảnh</span>
            </div>
          </div>
        </div>

        {editStep === 'edit' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề bài viết *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
                  placeholder="Nhập tiêu đề bài viết..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả ngắn *
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.excerpt ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
                  placeholder="Nhập mô tả ngắn về bài viết..."
                />
                {errors.excerpt && (
                  <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung bài viết *
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={12}
                  value={formData.content}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.content ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
                  placeholder="Nhập nội dung bài viết..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
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

          {/* SEO Preview */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Preview SEO</h2>
            </div>
            <div className="p-6">
              <SeoPreview
                title={seoPreview.title}
                url={seoPreview.url}
                description={seoPreview.description}
                siteName={seoPreview.siteName}
              />
            </div>
          </div>

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
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setEditStep('images')}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Chỉnh sửa hình ảnh
            </button>
            
            <div className="flex space-x-4">
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
                {isLoading ? 'Đang cập nhật...' : 'Cập nhật bài viết'}
              </button>
            </div>
          </div>
        </form>
        ) : (
          /* Edit Images Step */
          <div className="space-y-6">
            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Chỉnh sửa hình ảnh
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Thêm, xóa hoặc sắp xếp lại hình ảnh cho bài viết. Hình đầu tiên sẽ được sử dụng làm hình ảnh chính.
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Chỉnh sửa hình ảnh</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Thêm hoặc chỉnh sửa hình ảnh cho bài viết. Hình đầu tiên sẽ được sử dụng làm hình ảnh chính.
                </p>
              </div>
              <div className="p-6">
                <ImageUpload
                  onImagesUploaded={handleImagesUploaded}
                  currentImages={images}
                  label="Hình ảnh bài viết"
                  multiple={true}
                  postId={postId}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setEditStep('edit')}
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
      title="Cập nhật bài viết thành công!"
      message="Bài viết đã được cập nhật thành công. Đang chuyển hướng..."
      onClose={() => setShowSuccess(false)}
      autoClose={true}
      autoCloseDelay={2000}
    />
  </>
);
}
