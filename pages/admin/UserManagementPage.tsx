// pages/admin/UserManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';

interface SystemUser {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  permissions: string[];
  last_login: string | null;
  timezone: string;
  language: string;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

interface PaginationData {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'viewer'
  });

  const [editFormData, setEditFormData] = useState<any>({});

  // Available roles and statuses
  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'support', label: 'Support' },
    { value: 'viewer', label: 'Viewer' }
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' }
  ];

  // Fetch users
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString(),
        ...(search && { search })
      });

      const response = await apiFetch<{
        success: boolean;
        users: SystemUser[];
        pagination: PaginationData;
      }>(`/admin/system-users?${queryParams}`);

      if (response.success) {
        setUsers(response.users);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchTerm);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, searchTerm);
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const response = await apiFetch<{ success: boolean; user: SystemUser; message: string }>('/admin/system-users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        setSuccess('User created successfully');
        setShowCreateModal(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'viewer'
        });
        fetchUsers(pagination.page, searchTerm);
      } else {
        setError(response.message || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await apiFetch<{ success: boolean; user: SystemUser; message: string }>(
        `/admin/system-users/${selectedUser.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(editFormData)
        }
      );

      if (response.success) {
        setSuccess('User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        setEditFormData({});
        fetchUsers(pagination.page, searchTerm);
      } else {
        setError(response.message || 'Failed to update user');
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await apiFetch<{ success: boolean; message: string }>(
        `/admin/system-users/${userId}`,
        {
          method: 'DELETE'
        }
      );

      if (response.success) {
        setSuccess('User deleted successfully');
        fetchUsers(pagination.page, searchTerm);
      } else {
        setError(response.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to delete user');
    }
  };

  // Open edit modal
  const openEditModal = (user: SystemUser) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      status: user.status,
      timezone: user.timezone,
      language: user.language
    });
    setShowEditModal(true);
  };

  // Reset password
  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await apiFetch<{ success: boolean; message: string }>(
        `/admin/system-users/${userId}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ new_password: newPassword })
        }
      );

      if (response.success) {
        setSuccess('Password reset successfully');
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to reset password');
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'admin': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'moderator': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'support': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'viewer': return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'inactive': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'suspended': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'pending': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="p-6"> {/* REMOVED ml-64 from here */}
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">System Users</h1>
            <p className="text-slate-400">Manage admin users and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Create User
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠</span>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900/50 border border-green-700 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              <p className="text-green-300">{success}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchUsers(1, '');
              }}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-medium"
            >
              Clear
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No users found</p>
              {searchTerm && (
                <p className="text-slate-500 text-sm mt-2">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.username
                              }
                            </div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                            <div className="text-xs text-slate-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {roles.find(r => r.value === user.role)?.label || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {formatDate(user.last_login)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-blue-500/10"
                              title="Edit User"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="text-yellow-400 hover:text-yellow-300 transition-colors px-2 py-1 rounded hover:bg-yellow-500/10"
                              title="Reset Password"
                            >
                              Reset PW
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={user.role === 'super_admin'}
                              title={user.role === 'super_admin' ? 'Cannot delete super admin' : 'Delete User'}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                      Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                      {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                      {pagination.total} users
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors font-medium"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium">
                        {pagination.page}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Create New User</h2>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    placeholder="Enter password"
                    minLength={8}
                  />
                  <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Edit User</h2>
                <p className="text-slate-400 text-sm mt-1">Editing: {selectedUser.username}</p>
              </div>
              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Role *
                    </label>
                    <select
                      required
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={editFormData.timezone}
                      onChange={(e) => setEditFormData({ ...editFormData, timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Language
                    </label>
                    <input
                      type="text"
                      value={editFormData.language}
                      onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;