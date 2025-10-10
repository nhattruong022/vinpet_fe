'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  order: number;
  isActive: boolean;
  parentId?: string;
  children?: MenuItem[];
}

export default function MenuManagement() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    order: 0,
    isActive: true,
    parentId: '',
  });

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadMenuItems();
  }, [router]);

  const loadMenuItems = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: MenuItem[] = [
        {
          id: '1',
          title: 'Trang chủ',
          url: '/',
          order: 1,
          isActive: true,
        },
        {
          id: '2',
          title: 'Về chúng tôi',
          url: '/about',
          order: 2,
          isActive: true,
        },
        {
          id: '3',
          title: 'Dịch vụ',
          url: '/services',
          order: 3,
          isActive: true,
          children: [
            {
              id: '3-1',
              title: 'Chăm sóc thú cưng',
              url: '/services/pet-care',
              order: 1,
              isActive: true,
              parentId: '3',
            },
            {
              id: '3-2',
              title: 'Spa thú cưng',
              url: '/services/pet-spa',
              order: 2,
              isActive: true,
              parentId: '3',
            },
          ],
        },
        {
          id: '4',
          title: 'Liên hệ',
          url: '/contact',
          order: 4,
          isActive: true,
        },
      ];
      setMenuItems(mockData);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setFormData({
      title: '',
      url: '',
      order: menuItems.length + 1,
      isActive: true,
      parentId: '',
    });
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setFormData({
      title: item.title,
      url: item.url,
      order: item.order,
      isActive: item.isActive,
      parentId: item.parentId || '',
    });
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        // Update existing item
        const updatedItems = menuItems.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...formData }
            : item
        );
        setMenuItems(updatedItems);
      } else {
        // Create new item
        const newItem: MenuItem = {
          id: Date.now().toString(),
          ...formData,
        };
        setMenuItems([...menuItems, newItem]);
      }
      
      // Reset form
      setIsCreating(false);
      setEditingItem(null);
      setFormData({
        title: '',
        url: '',
        order: 0,
        isActive: true,
        parentId: '',
      });
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa menu item này?')) {
      const updatedItems = menuItems.filter(item => item.id !== id);
      setMenuItems(updatedItems);
    }
  };

  const toggleActive = async (id: string) => {
    const updatedItems = menuItems.map(item => 
      item.id === id 
        ? { ...item, isActive: !item.isActive }
        : item
    );
    setMenuItems(updatedItems);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => (
    <div key={item.id} className={`${level > 0 ? 'ml-6' : ''}`}>
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div>
            <h3 className="font-medium text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.url}</p>
            <p className="text-xs text-gray-400">Thứ tự: {item.order}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleActive(item.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              item.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </button>
          <button
            onClick={() => handleEdit(item)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {item.children && item.children.map(child => renderMenuItem(child, level + 1))}
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Menu</h1>
              <p className="text-gray-600 mt-2">Quản lý menu navigation của website VINPET</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Thêm Menu Item</span>
            </button>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh sách Menu Items</h2>
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <p className="text-gray-500">Chưa có menu item nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.map(item => renderMenuItem(item))}
            </div>
          )}
        </div>

        {/* Create/Edit Form Modal */}
        {(isCreating || editingItem) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Chỉnh sửa Menu Item' : 'Thêm Menu Item Mới'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tiêu đề menu"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập URL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập thứ tự"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Hoạt động
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
