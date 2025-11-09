import React, { useState, useEffect, useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { userService } from '../services/api';
import { type User } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

type SortField = 'isActive' | 'isVerified' | 'createdAt' | null;
type SortDirection = 'asc' | 'desc';

const UserManagementDashboard: React.FC = () => {
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
            setError(response.error?.description || 'Không thể tải danh sách người dùng');
          }
        }
      }
      
      // Filter only users with role "User" or null
      const userUsers = allFetchedUsers.filter(user => user.role === 'User' || user.role === null);
      setAllUsers(userUsers);
      
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
        // If role changed from User to something else, remove from list
        if (newRole !== 'User') {
          setAllUsers(prevUsers => prevUsers.filter(u => u.userId !== userId));
        } else {
          // If changed to User, refresh the list
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

  // Calculate chart data for Active Status
  const activeStatusChartData = useMemo(() => {
    const activeCount = allUsers.filter(user => user.isActive).length;
    const inactiveCount = allUsers.filter(user => !user.isActive).length;
    const total = allUsers.length;

    if (total === 0) {
      return {
        labels: ['Hoạt động', 'Không hoạt động'],
        data: [0, 0],
        percentages: [0, 0],
        counts: [0, 0],
      };
    }

    const activePercentage = Math.round((activeCount / total) * 100);
    const inactivePercentage = Math.round((inactiveCount / total) * 100);

    return {
      labels: ['Hoạt động', 'Không hoạt động'],
      data: [activeCount, inactiveCount],
      percentages: [activePercentage, inactivePercentage],
      counts: [activeCount, inactiveCount],
    };
  }, [allUsers]);

  // Calculate chart data for Verification Status
  const verificationStatusChartData = useMemo(() => {
    const verifiedCount = allUsers.filter(user => user.isVerified).length;
    const unverifiedCount = allUsers.filter(user => !user.isVerified).length;
    const total = allUsers.length;

    if (total === 0) {
      return {
        labels: ['Đã xác thực', 'Chưa xác thực'],
        data: [0, 0],
        percentages: [0, 0],
        counts: [0, 0],
      };
    }

    const verifiedPercentage = Math.round((verifiedCount / total) * 100);
    const unverifiedPercentage = Math.round((unverifiedCount / total) * 100);

    return {
      labels: ['Đã xác thực', 'Chưa xác thực'],
      data: [verifiedCount, unverifiedCount],
      percentages: [verifiedPercentage, unverifiedPercentage],
      counts: [verifiedCount, unverifiedCount],
    };
  }, [allUsers]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll use custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Active Status Chart Data
  const activeStatusChart = {
    labels: activeStatusChartData.labels,
    datasets: [
      {
        data: activeStatusChartData.data,
        backgroundColor: ['#007bff', '#ffc107'],
        borderColor: ['#0056b3', '#e0a800'],
        borderWidth: 2,
      },
    ],
  };

  // Verification Status Chart Data
  const verificationStatusChart = {
    labels: verificationStatusChartData.labels,
    datasets: [
      {
        data: verificationStatusChartData.data,
        backgroundColor: ['#17a2b8', '#ffc107'],
        borderColor: ['#138496', '#e0a800'],
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Charts Section */}
        {allUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <Pie data={activeStatusChart} options={chartOptions} />
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#007bff]"></div>
                    <span className="text-sm text-muted-foreground">Hoạt động:</span>
                    <span className="text-sm font-semibold">{activeStatusChartData.percentages[0]}% ({activeStatusChartData.counts[0]})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#ffc107]"></div>
                    <span className="text-sm text-muted-foreground">Không hoạt động:</span>
                    <span className="text-sm font-semibold">{activeStatusChartData.percentages[1]}% ({activeStatusChartData.counts[1]})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái xác thực</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <Pie data={verificationStatusChart} options={chartOptions} />
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#17a2b8]"></div>
                    <span className="text-sm text-muted-foreground">Đã xác thực:</span>
                    <span className="text-sm font-semibold">{verificationStatusChartData.percentages[0]}% ({verificationStatusChartData.counts[0]})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#ffc107]"></div>
                    <span className="text-sm text-muted-foreground">Chưa xác thực:</span>
                    <span className="text-sm font-semibold">{verificationStatusChartData.percentages[1]}% ({verificationStatusChartData.counts[1]})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort('isActive')}
                    >
                      Trạng thái
                      {sortField === 'isActive' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort('isVerified')}
                    >
                      Xác thực
                      {sortField === 'isVerified' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort('createdAt')}
                    >
                      Ngày tạo
                      {sortField === 'createdAt' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? `Không tìm thấy người dùng nào với từ khóa "${searchTerm}"` : 'Không có người dùng nào'}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role || 'User'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'warning'}>
                          {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? 'default' : 'warning'}>
                          {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={user.isActive ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleActivation(user.userId, user.isActive)}
                          >
                            {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          </Button>
                          <Select
                            value={user.role || 'User'}
                            onValueChange={(value: string) => handleRoleChange(user.userId, value)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="User">User</SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Hiển thị {(pageNumber - 1) * pageSize + 1} - {Math.min(pageNumber * pageSize, filteredUsers.length)} trong tổng số {filteredUsers.length} người dùng
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(1)}
                disabled={pageNumber === 1}
              >
                <ChevronFirst className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                disabled={pageNumber === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: Math.ceil(filteredUsers.length / pageSize) }, (_, i) => i + 1)
                .filter(page => {
                  const totalPages = Math.ceil(filteredUsers.length / pageSize);
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - pageNumber) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && <span className="px-2 text-muted-foreground">...</span>}
                      <Button
                        variant={page === pageNumber ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPageNumber(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(prev => prev + 1)}
                disabled={(pageNumber * pageSize) >= filteredUsers.length}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(Math.ceil(filteredUsers.length / pageSize))}
                disabled={(pageNumber * pageSize) >= filteredUsers.length}
              >
                <ChevronLast className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementDashboard;

