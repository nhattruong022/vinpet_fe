'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService, Post } from '@/lib/api';

export default function ViewPost() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadPost();
  }, [postId, router]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const postData = await apiService.getPost(postId);
      setPost(postData);
    } catch (error: any) {
      console.error('Error loading post:', error);
      setError('Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy bài viết'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách
          </button>
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/posts/edit/${post._id}`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Chỉnh sửa</span>
            </Link>
          </div>
        </div>

        {/* Post Content */}
        <article className="bg-white rounded-lg shadow-lg p-8">
          {/* Featured Image */}
          {post.featuredImageUrl && (
            <img
              src={post.featuredImageUrl.startsWith('http') || post.featuredImageUrl.startsWith('data:') 
                ? post.featuredImageUrl 
                : `http://localhost:8080${post.featuredImageUrl}`}
              alt={post.title}
              className="w-full h-96 object-cover rounded-lg mb-6"
              onError={(e) => {
                console.error('Error loading featured image:', post.featuredImageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          {/* Meta Information */}
          <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500 border-b border-gray-200 pb-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                {post.author?.firstName && post.author?.lastName
                  ? `${post.author.firstName} ${post.author.lastName}`
                  : post.author?.email || 'N/A'}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                post.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
              </span>
            </div>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6 italic">{post.excerpt}</p>
          )}

          {/* Content */}
          <div className="prose max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Images Gallery */}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-8">
              {[...post.images]
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((image, index) => {
                  // Determine image source: prioritize base64, then URL
                  const imageSrc = image.image 
                    ? image.image 
                    : image.url 
                      ? (image.url.startsWith('http') || image.url.startsWith('data:') 
                          ? image.url 
                          : `http://localhost:8080${image.url}`)
                      : null;
                  
                  if (!imageSrc) return null;
                  
                  return (
                    <div key={image.id || index} className="relative">
                      <img
                        src={imageSrc}
                        alt={`${post.title} - Image ${index + 1}`}
                        className="w-full h-auto rounded-lg border border-gray-200"
                        onError={(e) => {
                          console.error('Error loading image:', imageSrc);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  );
                })}
            </div>
          )}

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Danh mục:</h3>
              <div className="flex flex-wrap gap-2">
                {post.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SEO Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin SEO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">SEO Title:</span>
                <p className="text-gray-600 mt-1">{post.seoTitle || '-'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Permalink:</span>
                <p className="text-gray-600 mt-1">{post.permalink || '-'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Meta Description:</span>
                <p className="text-gray-600 mt-1">{post.metaDescription || '-'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">SEO Score:</span>
                <p className="text-gray-600 mt-1">{post.seoScore || '-'}</p>
              </div>
              {post.canonicalUrl && (
                <div>
                  <span className="font-medium text-gray-700">Canonical URL:</span>
                  <p className="text-gray-600 mt-1">{post.canonicalUrl}</p>
                </div>
              )}
            </div>
          </div>

          {/* Robots Meta */}
          {post.robotsMeta && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Robots Meta</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Index:</span>
                  <p className="text-gray-600 mt-1">{post.robotsMeta.index ? '✓' : '✗'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">No Follow:</span>
                  <p className="text-gray-600 mt-1">{post.robotsMeta.nofollow ? '✓' : '✗'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">No Image Index:</span>
                  <p className="text-gray-600 mt-1">{post.robotsMeta.noimageindex ? '✓' : '✗'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">No Archive:</span>
                  <p className="text-gray-600 mt-1">{post.robotsMeta.noarchive ? '✓' : '✗'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">No Snippet:</span>
                  <p className="text-gray-600 mt-1">{post.robotsMeta.nosnippet ? '✓' : '✗'}</p>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

