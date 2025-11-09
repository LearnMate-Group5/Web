import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { type User } from '../types';
import './AdminDashboard.css';

type SortField = 'isActive' | 'isVerified' | 'createdAt' | null;
type SortDirection = 'asc' | 'desc';

const StaffManagementDashboard: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(8);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all users with a large page size
      // We'll fetch multiple pages if needed to get all users
      let allFetchedUsers: User[] = [];
      let currentPage = 1;
      let hasMore = true;
      const fetchPageSize = 100; // Fetch 100 users per request
      
      while (hasMore) {
        const response = await userService.getUserList(currentPage, fetchPageSize);
        
        if (response.isSuccess && response.value.users.length > 0) {
          allFetchedUsers = [...allFetchedUsers, ...response.value.users];
          
          // If we got fewer users than requested, we've reached the end
          if (response.value.users.length < fetchPageSize) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
          if (!response.isSuccess) {
            setError(response.error?.description || 'Không thể tải danh sách nhân viên');
          }
        }
      }
      
      // Filter only users with role "Staff"
      const staffUsers = allFetchedUsers.filter(user => user.role === 'Staff');
      setAllUsers(staffUsers);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Filter and sort users
  useEffect(() => {
    let processed = [...allUsers];
    
    // Filter by search term (name)
    if (searchTerm.trim()) {
      processed = processed.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    if (sortField) {
      processed.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortField) {
          case 'isActive':
            aValue = a.isActive ? 1 : 0;
            bValue = b.isActive ? 1 : 0;
            break;
          case 'isVerified':
            aValue = a.isVerified ? 1 : 0;
            bValue = b.isVerified ? 1 : 0;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredUsers(processed);
    setPageNumber(1); // Reset to first page when filter or sort changes
  }, [searchTerm, sortField, sortDirection, allUsers]);

  // Paginate sorted and filtered users
  useEffect(() => {
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    setDisplayedUsers(paginatedUsers);
  }, [pageNumber, filteredUsers, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleActivation = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await userService.toggleUserActivation(userId, !currentStatus);
      
      if (response.isSuccess) {
        // Update local state
        setAllUsers(prevUsers => 
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
        // If role changed from Staff to something else, remove from list
        if (newRole !== 'Staff') {
          setAllUsers(prevUsers => prevUsers.filter(u => u.userId !== userId));
        } else {
          // If changed to Staff, refresh the list
          fetchAllUsers();
        }
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
        <h1>Quản lý nhân viên</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-content">
        <div className="search-filter-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th 
                  className={`sortable-header ${sortField === 'isActive' ? (sortDirection === 'asc' ? 'asc' : 'desc') : ''} ${sortField === 'isActive' ? 'active' : ''}`}
                  onClick={() => handleSort('isActive')}
                >
                  Trạng thái
                  <span className="sort-icon"></span>
                </th>
                <th 
                  className={`sortable-header ${sortField === 'isVerified' ? (sortDirection === 'asc' ? 'asc' : 'desc') : ''} ${sortField === 'isVerified' ? 'active' : ''}`}
                  onClick={() => handleSort('isVerified')}
                >
                  Xác thực
                  <span className="sort-icon"></span>
                </th>
                <th 
                  className={`sortable-header ${sortField === 'createdAt' ? (sortDirection === 'asc' ? 'asc' : 'desc') : ''} ${sortField === 'createdAt' ? 'active' : ''}`}
                  onClick={() => handleSort('createdAt')}
                >
                  Ngày tạo
                  <span className="sort-icon"></span>
                </th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm ? `Không tìm thấy nhân viên nào với từ khóa "${searchTerm}"` : 'Không có nhân viên nào'}
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => (
                <tr key={user.userId}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-badge">
                      {user.role || 'Staff'}
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
                      value={user.role || 'Staff'}
                      title="Chọn vai trò cho nhân viên"
                    >
                      <option value="User">User</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Hiển thị {(pageNumber - 1) * pageSize + 1} - {Math.min(pageNumber * pageSize, filteredUsers.length)} trong tổng số {filteredUsers.length} nhân viên
          </div>
          <div className="pagination-buttons">
            <button 
              onClick={() => setPageNumber(1)}
              disabled={pageNumber === 1}
              className="page-button"
            >
              «
            </button>
            <button 
              onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
              disabled={pageNumber === 1}
              className="page-button"
            >
              Trước
            </button>
            
            {filteredUsers.length > 0 && Array.from({ length: Math.ceil(filteredUsers.length / pageSize) }, (_, i) => i + 1)
              .filter(page => {
                // Show first page, last page, current page, and pages around current
                const totalPages = Math.ceil(filteredUsers.length / pageSize);
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - pageNumber) <= 1) return true;
                return false;
              })
              .map((page, index, array) => {
                // Add ellipsis
                const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsisBefore && <span className="page-info">...</span>}
                    <button
                      onClick={() => setPageNumber(page)}
                      className={`page-number-button ${page === pageNumber ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
            
            <button 
              onClick={() => setPageNumber(prev => prev + 1)}
              disabled={(pageNumber * pageSize) >= filteredUsers.length}
              className="page-button"
            >
              Sau
            </button>
            <button 
              onClick={() => setPageNumber(Math.ceil(filteredUsers.length / pageSize))}
              disabled={(pageNumber * pageSize) >= filteredUsers.length}
              className="page-button"
            >
              »
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagementDashboard;

