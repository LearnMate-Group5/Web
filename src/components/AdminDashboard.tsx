import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { type User } from '../types';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(8);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getUserList(pageNumber, pageSize);
      
      if (response.isSuccess) {
        setUsers(response.value.users);
      } else {
        setError(response.error.description || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pageNumber]);

  const handleToggleActivation = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await userService.toggleUserActivation(userId, !currentStatus);
      
      if (response.isSuccess) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.userId === userId ? { ...u, isActive: !currentStatus } : u
          )
        );
      } else {
        setError(response.error.description || 'Không thể cập nhật trạng thái');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await userService.updateUserRole(userId, newRole);
      
      if (response.isSuccess) {
        // Refresh user list to get updated data
        fetchUsers();
      } else {
        setError(response.error.description || 'Không thể cập nhật vai trò');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật vai trò');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Quản lý người dùng</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-content">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Xác thực</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-badge">
                      {user.role || 'Chưa có vai trò'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                      {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleToggleActivation(user.userId, user.isActive)}
                      className={`action-button ${user.isActive ? 'deactivate' : 'activate'}`}
                    >
                      {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </button>
                    <select
                      onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                      className="role-select"
                      value={user.role || ''}
                      title="Chọn vai trò cho người dùng"
                    >
                      <option value="" disabled>Chọn vai trò</option>
                      <option value="Admin">Admin</option>
                      <option value="Staff">Staff</option>
                      <option value="User">User</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button 
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber === 1}
            className="page-button"
          >
            Trước
          </button>
          <span className="page-info">Trang {pageNumber}</span>
          <button 
            onClick={() => setPageNumber(prev => prev + 1)}
            disabled={users.length < pageSize}
            className="page-button"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
