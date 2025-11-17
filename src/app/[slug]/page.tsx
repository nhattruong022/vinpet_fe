'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiService, Post } from '@/lib/api';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    loadPosts();
  }, [slug]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get posts by category slug
      const response = await apiService.getPostsByCategory(slug, 1, 10);
      setPosts(response.posts || []);
      
      // If there's only one post, show it directly
      if (response.posts && response.posts.length === 1) {
        setSelectedPost(response.posts[0]);
      }
    } catch (error: any) {
      console.error('Error loading posts:', error);
      setError('Không thể tải nội dung. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostClick = async (postId: string) => {
    try {
      const post = await apiService.getPost(postId);
      setSelectedPost(post);
    } catch (error) {
      console.error('Error loading post:', error);
      setError('Không thể tải bài viết. Vui lòng thử lại.');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadPosts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // If a post is selected, show post detail
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedPost(null)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách
          </button>

          <article className="bg-white rounded-lg shadow-lg p-8">
            {selectedPost.featuredImageUrl && (
              <img
                src={selectedPost.featuredImageUrl}
                alt={selectedPost.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
            
            {selectedPost.excerpt && (
              <p className="text-xl text-gray-600 mb-6">{selectedPost.excerpt}</p>
            )}

            <div className="prose max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
            </div>

            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {selectedPost.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`${selectedPost.title} - Image ${index + 1}`}
                    className="w-full h-auto rounded-lg"
                  />
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
              <p>Ngày đăng: {new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}</p>
              {selectedPost.author && (
                <p>Tác giả: {selectedPost.author.firstName} {selectedPost.author.lastName}</p>
              )}
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Show list of posts
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {posts.length > 0 ? `Danh sách bài viết` : 'Chưa có bài viết nào'}
        </h1>

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">Chưa có bài viết nào trong danh mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => handlePostClick(post._id)}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              >
                {post.featuredImageUrl && (
                  <img
                    src={post.featuredImageUrl}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="text-blue-600 hover:text-blue-800">Đọc thêm →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

