'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, CategoryTreeNode } from '@/lib/api';
import Toast from '@/components/Toast';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  order: number;
  isActive: boolean;
  slug?: string;
  key?: string;
  parentId?: string | null;
  children?: MenuItem[];
}

export default function MenuManagement() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
  });
  const [formData, setFormData] = useState({
    menuName: '',
    description: '',
    sortOrder: 0,
    status: 'active' as 'active' | 'inactive',
    parent: null as string | null,
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
      const tree = await apiService.getCategoryTree({
        rootOnly: false,
        includeInactive: true,
      });

      setCategoryTree(tree);
      const transformedItems = buildMenuItems(tree);
      setMenuItems(transformedItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
      setMenuItems([]);
      setError('Không thể tải danh sách menu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to flatten category tree for parent dropdown
  const flattenCategories = (categories: CategoryTreeNode[], level = 0, excludeId?: string): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    categories.forEach(category => {
      // Skip the category being edited to avoid circular reference
      if (excludeId && category._id === excludeId) {
        return;
      }

      const prefix = level > 0 ? '└─ ' : '';
      const indent = '  '.repeat(level);
      // Use 'name' field (new format) or fallback to old format
      const displayName = category.name || category.name_vi || category.name_en || category.slug || 'Unnamed';
      result.push({
        id: category._id,
        name: `${indent}${prefix}${displayName}`,
        level,
      });
      if (category.children && category.children.length > 0) {
        result.push(...flattenCategories(category.children, level + 1, excludeId));
      }
    });
    return result;
  };

  const buildMenuItems = (categories: CategoryTreeNode[]): MenuItem[] => {
    const sortByOrder = <T extends { sortOrder?: number }>(nodes: T[]) =>
      [...nodes].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const mapCategoryToMenuItem = (
      category: CategoryTreeNode,
      parentSlugs: string[] = []
    ): MenuItem => {
      const pathSegments = [...parentSlugs, category.slug].filter(Boolean);
      const url =
        pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '/';

      const mappedChildren =
        category.children?.map((child) =>
          mapCategoryToMenuItem(child, pathSegments)
        ) ?? [];

      // Use 'name' field (new format) or fallback to old format
      const name = category.name || category.name_vi || category.name_en || category.name_ko || category.slug || '';
      const key = category.key || '';

      const item: MenuItem = {
        id: category._id,
        title: name,
        url,
        order: category.sortOrder ?? 0,
        isActive: category.isActive,
        slug: category.slug,
        parentId: category.parent,
        key: key, // Store key separately for display
      };

      if (mappedChildren.length > 0) {
        item.children = mappedChildren.sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
      }

      return item;
    };

    return sortByOrder(categories).map((category) =>
      mapCategoryToMenuItem(category)
    );
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setError(null);
    setFormData({
      menuName: '',
      description: '',
      sortOrder: menuItems.length + 1,
      status: 'active',
      parent: null,
    });
  };

  const handleEdit = (item: MenuItem) => {
    // Find the category from tree to get full data
    const findCategory = (categories: CategoryTreeNode[], id: string): CategoryTreeNode | null => {
      for (const cat of categories) {
        if (cat._id === id) return cat;
        if (cat.children) {
          const found = findCategory(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const category = findCategory(categoryTree, item.id);
    if (category) {
      setEditingItem(item);
      setIsCreating(false);
      setError(null);
      // Use 'name' field (new format) or fallback to old format
      const menuName = category.name || category.name_vi || category.name_en || category.name_ko || category.slug || '';
      const description = category.description || '';
      setFormData({
        menuName,
        description,
        sortOrder: category.sortOrder ?? 0,
        status: category.isActive ? 'active' : 'inactive',
        parent: category.parent,
      });
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.menuName || formData.menuName.trim() === '') {
      setError('Vui lòng nhập tên menu');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const categoryData = {
        menuName: formData.menuName.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        sortOrder: formData.sortOrder,
        parent: formData.parent || undefined,
      };

      if (editingItem) {
        // Update existing category
        await apiService.updateCategory(editingItem.id, categoryData);
        setToast({
          isVisible: true,
          type: 'success',
          title: 'Cập nhật thành công!',
          message: `Menu item "${formData.menuName}" đã được cập nhật thành công.`,
        });
      } else {
        // Create new category
        await apiService.createCategory(categoryData);
        setToast({
          isVisible: true,
          type: 'success',
          title: 'Tạo mới thành công!',
          message: `Menu item "${formData.menuName}" đã được tạo thành công.`,
        });
      }

      // Reload menu items after save
      await loadMenuItems();

      // Reset form
      setIsCreating(false);
      setEditingItem(null);
      setFormData({
        menuName: '',
        description: '',
        sortOrder: 0,
        status: 'active',
        parent: null,
      });
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu menu item. Vui lòng thử lại.';
      setError(errorMessage);
      setToast({
        isVisible: true,
        type: 'error',
        title: 'Lỗi!',
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: MenuItem) => {
    setMenuItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!menuItemToDelete) return;

    try {
      await apiService.deleteCategory(menuItemToDelete.id);
      await loadMenuItems();
      setShowDeleteModal(false);
      setMenuItemToDelete(null);
      setToast({
        isVisible: true,
        type: 'success',
        title: 'Xóa thành công!',
        message: `Menu item "${menuItemToDelete.title}" đã được xóa thành công.`,
      });
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa menu item. Vui lòng thử lại.';
      setError(errorMessage);
      setToast({
        isVisible: true,
        type: 'error',
        title: 'Lỗi!',
        message: errorMessage,
      });
      setShowDeleteModal(false);
      setMenuItemToDelete(null);
    }
  };

  const toggleActive = async (id: string) => {
    const item = menuItems.find(m => m.id === id);
    if (!item) return;

    try {
      const newStatus = item.isActive ? 'inactive' : 'active';
      await apiService.updateCategory(id, {
        status: newStatus,
      });
      await loadMenuItems();
      setToast({
        isVisible: true,
        type: 'success',
        title: 'Cập nhật thành công!',
        message: `Trạng thái menu item "${item.title}" đã được cập nhật thành ${newStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}.`,
      });
    } catch (error: any) {
      console.error('Error toggling active status:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.';
      setError(errorMessage);
      setToast({
        isVisible: true,
        type: 'error',
        title: 'Lỗi!',
        message: errorMessage,
      });
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const containerClasses = [
      'flex items-start justify-between rounded-xl transition-all duration-200',
      'p-4',
      level === 0
        ? 'bg-white border border-gray-200 shadow-sm'
        : 'bg-blue-50 border border-blue-100 shadow-sm shadow-blue-100/40',
    ].join(' ');

    return (
      <div key={item.id} className={level === 0 ? '' : 'pl-4'}>
        <div className={containerClasses}>
          <div className="flex items-start space-x-4">
            <div className="flex flex-col items-center pt-1">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-0.5 ${item.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              ></div>
              {item.children && item.children.length > 0 && (
                <div className="flex-1 w-px bg-gradient-to-b from-green-400/60 to-transparent mt-2"></div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                {level > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-blue-600 bg-blue-100 rounded-full">
                    Submenu cấp {level}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{item.url}</p>
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                <span>Thứ tự: {item.order}</span>
                {item.slug && (
                  <span>
                    Slug: <span className="font-medium text-gray-700">{item.slug}</span>
                  </span>
                )}
              </div>
              {/* Hiển thị key nếu có */}
              {item.key && (
                <div className="mt-1">
                  <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                    Key: {item.key}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleActive(item.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
                }`}
            >
              {item.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </button>
            <button
              onClick={() => handleEdit(item)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Xóa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        {item.children && item.children.length > 0 && (
          <div className="ml-4 pl-6 border-l-2 border-dashed border-blue-200 mt-3 space-y-3">
            {item.children.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {(isCreating || editingItem) && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Chỉnh sửa Menu Item' : 'Thêm Menu Item Mới'}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên menu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.menuName}
                    onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên menu"
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mô tả menu"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục cha
                  </label>
                  <select
                    value={formData.parent || ''}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Không có (Root category - Menu cấp 1) --</option>
                    {flattenCategories(categoryTree, 0, editingItem?.id).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Chọn danh mục cha để tạo submenu. Để trống nếu đây là menu cấp 1.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập thứ tự"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="status"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="status" className="ml-2 text-sm text-gray-700">
                    Hoạt động
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingItem(null);
                    setError(null);
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSaving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{editingItem ? 'Cập nhật' : 'Tạo mới'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && menuItemToDelete && (
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
                        Xóa menu item
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Bạn có chắc chắn muốn xóa menu item &quot;{menuItemToDelete.title}&quot;? Hành động này không thể hoàn tác.
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
                    onClick={() => {
                      setShowDeleteModal(false);
                      setMenuItemToDelete(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        <Toast
          isVisible={toast.isVisible}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast({ ...toast, isVisible: false })}
          autoClose={true}
          autoCloseDelay={3000}
        />
      </div>
    </div>
  );
}
