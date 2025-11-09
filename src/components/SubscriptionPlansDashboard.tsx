import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../services/api';
import { type SubscriptionPlan, type CreateSubscriptionPlanRequest, type UpdateSubscriptionPlanRequest } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X, Edit, Trash2 } from 'lucide-react';

const SubscriptionPlansDashboard: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateSubscriptionPlanRequest>({
    name: '',
    type: '',
    status: 'active',
    originalPrice: 0,
    discount: 0
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await subscriptionService.getPlans();
      
      if (response.isSuccess) {
        setPlans(response.value);
      } else {
        setError(response.error?.description || 'Không thể tải danh sách gói đăng ký');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateFinalPrice = (originalPrice: number, discount: number) => {
    return originalPrice * (1 - discount / 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'originalPrice' || name === 'discount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setFormData({
      name: plan.name,
      type: plan.type,
      status: plan.status,
      originalPrice: plan.originalPrice,
      discount: plan.discount
    });
    setEditingPlanId(plan.subscriptionId);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      type: '',
      status: 'active',
      originalPrice: 0,
      discount: 0
    });
    setEditingPlanId(null);
    setShowForm(false);
  };

  const handleDelete = async (subscriptionId: string, planName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói "${planName}"?`)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await subscriptionService.deletePlan(subscriptionId);
      
      if (response.isSuccess) {
        // Refresh the plans list
        await fetchPlans();
      } else {
        setError(response.error?.description || 'Không thể xóa gói đăng ký');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa gói đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let response;
      if (editingPlanId) {
        // Update existing plan
        response = await subscriptionService.updatePlan(editingPlanId, formData as UpdateSubscriptionPlanRequest);
      } else {
        // Create new plan
        response = await subscriptionService.createPlan(formData);
      }
      
      if (response.isSuccess) {
        // Reset form and hide it
        handleCancel();
        // Refresh the plans list
        await fetchPlans();
      } else {
        setError(response.error?.description || (editingPlanId ? 'Không thể cập nhật gói đăng ký' : 'Không thể tạo gói đăng ký'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (editingPlanId ? 'Lỗi khi cập nhật gói đăng ký' : 'Lỗi khi tạo gói đăng ký'));
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Quản lý gói đăng ký</h1>
        <Button onClick={() => {
          if (showForm) {
            handleCancel();
          } else {
            setShowForm(true);
            setEditingPlanId(null);
          }
        }} variant="default">
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Đóng form
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Thêm gói mới
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPlanId ? 'Chỉnh sửa gói đăng ký' : 'Thêm gói đăng ký mới'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên gói *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập tên gói"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Loại *</Label>
                  <Input
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập loại gói"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Giá gốc (VND) *</Label>
                  <Input
                    id="originalPrice"
                    name="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="1000"
                    placeholder="Nhập giá gốc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Giảm giá (%) *</Label>
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    value={formData.discount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Nhập phần trăm giảm giá"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editingPlanId ? 'Đang cập nhật...' : 'Đang tạo...'}
                    </>
                  ) : (
                    editingPlanId ? 'Cập nhật' : 'Tạo gói'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Subscription Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách gói đăng ký</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên gói</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Giá gốc</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Giá cuối</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Không có gói đăng ký nào
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.subscriptionId}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{plan.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(plan.originalPrice)}</TableCell>
                      <TableCell>{plan.discount}%</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatPrice(calculateFinalPrice(plan.originalPrice, plan.discount))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(plan.subscriptionId, plan.name)}
                            disabled={submitting}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPlansDashboard;

