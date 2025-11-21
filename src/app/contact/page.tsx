'use client';

import { useState, useMemo, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/config/constants';
import Toast from '@/components/Toast';

interface Contact {
  _id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  returnCode: number;
  message: string;
  data: {
    contacts: Contact[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

export default function ContactPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Fetch contacts from API
  const fetchContacts = async (page: number = 1, search: string = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: itemsPerPage.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CONTACT.LIST}?${params}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setContacts(data.data.contacts);
        setTotalItems(data.data.totalItems);
        setTotalPages(data.data.totalPages);
        setCurrentPage(data.data.currentPage);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setToast({
        isVisible: true,
        type: 'error',
        title: 'Lỗi tải dữ liệu!',
        message: 'Không thể tải danh sách liên hệ. Vui lòng thử lại.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchContacts(1, '');
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchContacts(1, searchTerm);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchContacts(page, searchTerm);
  };

  // Since API handles search and pagination, we use contacts directly
  const paginatedContacts = contacts;
  
  // Calculate stats
  const recentlyUpdatedCount = useMemo(() => {
    return contacts.filter(contact => {
      const today = new Date();
      const updated = new Date(contact.updatedAt);
      const diffTime = Math.abs(today.getTime() - updated.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    }).length;
  }, [contacts]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Danh sách liên hệ
          </h1>
          <p className="text-gray-600">
            Quản lý và theo dõi các yêu cầu liên hệ từ khách hàng
          </p>
        </div>

        {/* Filters và Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Total Count */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                Tổng số: <span className="text-blue-600 font-semibold">{totalItems}</span> liên hệ
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Hiển thị: <strong>{paginatedContacts.length}</strong> / <strong>{totalItems}</strong> liên hệ</span>
            <span>Trang: <strong>{currentPage}</strong> / <strong>{totalPages}</strong></span>
            <span>Cập nhật gần đây: <strong>{recentlyUpdatedCount}</strong></span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Họ và tên</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Số điện thoại</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Email</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Tin nhắn</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Cập nhật lần cuối</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 rounded w-40"></div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="h-16 bg-gray-300 rounded w-full"></div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-center">
                        <div className="h-12 bg-gray-300 rounded w-20 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  paginatedContacts.map((contact, index) => (
                    <tr key={contact._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{contact.name}</div>
                            <div className="text-xs text-gray-500">ID: #{contact._id.slice(-6).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{contact.phone}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-sm text-gray-900">{contact.email}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-indigo-400">
                          <div className="text-sm text-gray-800 max-w-md line-clamp-2" title={contact.message}>
                            {contact.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(contact.updatedAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(contact.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {(() => {
                              const now = new Date();
                              const updated = new Date(contact.updatedAt);
                              const diffTime = Math.abs(now.getTime() - updated.getTime());
                              const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays > 0) {
                                return `${diffDays} ngày trước`;
                              } else if (diffHours > 0) {
                                return `${diffHours} giờ trước`;
                              } else {
                                return 'Vừa cập nhật';
                              }
                            })()
                            }
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {/* Empty State */}
                {!isLoading && paginatedContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Không có liên hệ nào</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có liên hệ nào được gửi'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị trang {currentPage} / {totalPages} (Tổng: {totalItems} kết quả)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}