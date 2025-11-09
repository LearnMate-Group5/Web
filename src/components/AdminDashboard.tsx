import React, { useState, useEffect } from 'react';
import { userService, subscriptionService } from '../services/api';
import { type User, type SubscriptionPlan } from '../types';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState('');
  const [plansError, setPlansError] = useState('');
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
        setError(response.error?.description || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      setPlansError('');
      const response = await subscriptionService.getPlans();
      
      if (response.isSuccess) {
        setPlans(response.value);
      } else {
        setPlansError(response.error?.description || 'Không thể tải danh sách gói đăng ký');
      }
    } catch (err) {
      setPlansError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pageNumber]);

  useEffect(() => {
    fetchPlans();
  }, []);

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
        setError(response.error?.description || 'Không thể cập nhật trạng thái');
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
        setError(response.error?.description || 'Không thể cập nhật vai trò');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật vai trò');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateFinalPrice = (originalPrice: number, discount: number) => {
    return originalPrice * (1 - discount / 100);
  };

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
        {/* Subscription Plans Section */}
        <div className="table-container" style={{ marginBottom: '30px' }}>
          <h2 style={{ padding: '20px', margin: 0, borderBottom: '2px solid #e9ecef' }}>Gói đăng ký</h2>
          {plansError && (
            <div className="error-message" style={{ margin: '15px 20px' }}>
              {plansError}
            </div>
          )}
          {plansLoading ? (
            <div className="loading">Đang tải gói đăng ký...</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Tên gói</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th>Giá gốc</th>
                  <th>Giảm giá</th>
                  <th>Giá cuối</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      Không có gói đăng ký nào
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.subscriptionId}>
                      <td>{plan.name}</td>
                      <td>
                        <span className="role-badge">
                          {plan.type}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${plan.status === 'active' ? 'active' : 'inactive'}`}>
                          {plan.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td>{formatPrice(plan.originalPrice)}</td>
                      <td>{plan.discount}%</td>
                      <td style={{ fontWeight: '600', color: '#28a745' }}>
                        {formatPrice(calculateFinalPrice(plan.originalPrice, plan.discount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Users Section */}
        {loading ? (
          <div className="table-container">
            <div className="loading">Đang tải danh sách người dùng...</div>
          </div>
        ) : (
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
        )}

        {!loading && (
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
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
