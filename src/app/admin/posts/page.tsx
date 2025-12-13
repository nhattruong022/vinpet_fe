'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiService, Post } from '@/lib/api';

export default function PostsManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  // Load posts from API
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPosts(currentPage, 10, filters);
      setPosts(response.posts);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    loadPosts();
  }, [currentPage, filters, loadPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPosts();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDeletePost = async (post: Post) => {
    try {
      await apiService.deletePost(post._id);
      loadPosts(); // Reload posts after deletion
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDelete = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const confirmDelete = () => {
    if (postToDelete) {
      handleDeletePost(postToDelete);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-1.5 h-1.5 mr-1" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
          Đã xuất bản
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <svg className="w-1.5 h-1.5 mr-1" fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
        Bản nháp
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý bài viết</h1>
              <p className="text-gray-600 mt-2">Quản lý và theo dõi tất cả bài viết trên website</p>
            </div>
            <Link
              href="/admin/posts/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Tạo bài viết mới
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="lg:w-48">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="updatedAt">Ngày cập nhật</option>
                <option value="title">Tiêu đề</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="lg:w-32">
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tổng bài viết</dt>
                    <dd className="text-lg font-medium text-gray-900">{totalItems}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Đã xuất bản</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {posts.filter(post => post.status === 'published').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Bản nháp</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {posts.filter(post => post.status === 'draft').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Hình ảnh
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '300px', maxWidth: '400px' }}>
                    Tiêu đề
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Tác giả
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    Thời gian
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Chi tiết SEO
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có bài viết</h3>
                        <p className="mt-1 text-sm text-gray-500">Bắt đầu tạo bài viết đầu tiên của bạn.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => {
                    // Get thumbnail URL - lấy image có position=0
                    const getThumbnailUrl = () => {
                      // Bước 1: Tìm image có position=0 trong images array
                      if (post.images && post.images.length > 0) {
                        const thumbnailImage = post.images.find(img => img.position === 0);
                        if (thumbnailImage) {
                          // Ưu tiên dùng image (base64) nếu có
                          if (thumbnailImage.image) {
                            return thumbnailImage.image;
                          }
                          // Nếu không có base64, dùng url
                          if (thumbnailImage.url) {
                            if (thumbnailImage.url.startsWith('http') || thumbnailImage.url.startsWith('data:')) {
                              return thumbnailImage.url;
                            }
                            return `http://localhost:8080${thumbnailImage.url}`;
                          }
                        }
                      }

                      // Bước 2: Fallback - dùng featuredImageUrl nếu có (trừ blob URL)
                      if (post.featuredImageUrl) {
                        if (!post.featuredImageUrl.startsWith('blob:')) {
                          if (post.featuredImageUrl.startsWith('http') || post.featuredImageUrl.startsWith('data:')) {
                            return post.featuredImageUrl;
                          }
                          return `http://localhost:8080${post.featuredImageUrl}`;
                        }
                      }

                      // Bước 3: Fallback cuối cùng - lấy image đầu tiên trong images array
                      if (post.images && post.images.length > 0) {
                        const firstImage = post.images[0];
                        if (firstImage) {
                          if (firstImage.image) {
                            return firstImage.image;
                          }
                          if (firstImage.url) {
                            if (firstImage.url.startsWith('http') || firstImage.url.startsWith('data:')) {
                              return firstImage.url;
                            }
                            return `http://localhost:8080${firstImage.url}`;
                          }
                        }
                      }

                      return null;
                    };

                    const thumbnailUrl = getThumbnailUrl();

                    return (
                      <tr key={post._id} className="hover:bg-gray-50">
                        {/* Checkbox */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        {/* Hình ảnh */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={post.title}
                              className="h-14 w-14 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-14 w-14 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </td>

                        {/* Tiêu đề */}
                        <td className="px-3 py-4" style={{ minWidth: '300px', maxWidth: '400px' }}>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/posts/${post._id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 block line-clamp-2"
                              title={(post as any).title_vi || (post as any).title_en || (post as any).title_ko || 'Không có tiêu đề'}
                            >
                              {(post as any).title_vi || (post as any).title_en || (post as any).title_ko || 'Không có tiêu đề'}
                            </Link>
                            {post.excerpt && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={post.excerpt}>
                                {post.excerpt}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Tác giả */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate max-w-[120px]">
                            {post.author?.firstName && post.author?.lastName
                              ? `${post.author.firstName} ${post.author.lastName}`
                              : post.author?.email || 'N/A'
                            }
                          </div>
                        </td>

                        {/* Thời gian */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="flex items-center mb-1">
                              {getStatusBadge(post.status)}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {formatDate(post.createdAt)}
                            </div>
                          </div>
                        </td>

                        {/* Chi tiết SEO */}
                        <td className="px-3 py-4">
                          <div className="text-sm">
                            {/* SEO Score */}
                            <div className="flex items-center mb-1">
                              <div className={`px-2 py-0.5 rounded text-xs font-medium ${(post.seoScore || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                (post.seoScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {post.seoScore || 0}/100
                              </div>
                            </div>

                            {/* Keywords - rút gọn */}
                            {post.seoTitle && (
                              <div className="text-xs text-gray-600 truncate max-w-[180px]">
                                <span className="font-medium">Từ khóa:</span> <span className="truncate">{post.seoTitle.split('|')[0]?.trim().substring(0, 15)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Thao tác */}
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            <Link
                              href={`/admin/posts/edit/${post._id}`}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Chỉnh sửa"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(post)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Xóa"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && postToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all max-w-lg w-full pointer-events-auto">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Xóa bài viết
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Bạn có chắc chắn muốn xóa bài viết &quot;{postToDelete.title}&quot;? Hành động này không thể hoàn tác.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={confirmDelete}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

