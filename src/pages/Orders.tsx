import { MainLayout } from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  X,
  Loader2,
  FileText,
  Download,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';
import type { Order, OrderProject, Project } from '@/types/models';
import { getCloudinaryProjectImageUrl } from '@/utils/imageUtils';
import { formatCurrency } from '@/utils/format';
import { useOrders, useCancelOrder } from '@/hooks/useOrders';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ✅ Sử dụng React Query để đồng bộ đơn hàng
  const { data: orders = [], isLoading: loading } = useOrders();
  const cancelOrderMutation = useCancelOrder();

  const isProjectDocument = (value: OrderProject['IdSanPham']): value is Project => {
    return Boolean(value) && typeof value === 'object';
  };

  // ✅ Đã chuyển sang useOrders hook, không cần fetchOrders nữa

  const getStatusBadge = (statusCode: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      shipping: { label: 'Đang giao hàng', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Đã giao hàng', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[statusCode] || { label: statusCode, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getOrderHistory = (order: unknown) => {
    const history = [];
    const orderRecord = order as Record<string, unknown>;
    const statusCode = orderRecord.statusCode || (orderRecord.raw as Record<string, unknown> | undefined)?.TrangThai;
    
    if (statusCode === 'delivered') {
      history.push({
        event: 'Đã giao hàng',
        timestamp: orderRecord.updatedAt || orderRecord.createdAt,
        details: ['Đơn hàng đã được giao thành công'],
      });
    }
    
    if (statusCode === 'shipping' || statusCode === 'delivered') {
      history.push({
        event: 'Đang giao hàng',
        timestamp: orderRecord.updatedAt || orderRecord.createdAt,
        details: ['Đơn hàng đang được vận chuyển'],
      });
    }
    
    if (statusCode === 'confirmed' || statusCode === 'shipping' || statusCode === 'delivered') {
      history.push({
        event: 'Đã xác nhận',
        timestamp: orderRecord.updatedAt || orderRecord.createdAt,
        details: ['Đơn hàng đã được xác nhận'],
      });
    }
    
    history.push({
      event: 'Đặt mua',
      timestamp: orderRecord.createdAt,
      details: ['Đơn hàng đã được tạo'],
    });

    return history.reverse();
  };

  const canCancelOrder = (order: unknown) => {
    const orderRecord = order as Record<string, unknown>;
    const statusCode = orderRecord.statusCode || (orderRecord.raw as Record<string, unknown> | undefined)?.TrangThai;
    return statusCode === 'pending' || statusCode === 'confirmed';
  };

  const getFilteredOrders = () => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => {
      const statusCode = order.statusCode || order.raw?.TrangThai;
      return statusCode === statusFilter;
    });
  };

  const getOrdersByStatus = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => (o.statusCode || o.raw?.TrangThai) === 'pending').length,
      confirmed: orders.filter(o => (o.statusCode || o.raw?.TrangThai) === 'confirmed').length,
      shipping: orders.filter(o => (o.statusCode || o.raw?.TrangThai) === 'shipping').length,
      delivered: orders.filter(o => (o.statusCode || o.raw?.TrangThai) === 'delivered').length,
      cancelled: orders.filter(o => (o.statusCode || o.raw?.TrangThai) === 'cancelled').length,
    };
  };

  const handleCancelOrder = () => {
    if (!cancellingOrderId) return;
    
    cancelOrderMutation.mutate({
      orderId: cancellingOrderId,
      reason: cancelReason || 'Khách hàng yêu cầu hủy đơn hàng',
    });
    
    setIsCancelDialogOpen(false);
    setCancelReason('');
    setCancellingOrderId(null);
  };

  const openCancelDialog = (order: { _id?: string; id?: string }) => {
    setCancellingOrderId(order._id || order.id || '');
    setIsCancelDialogOpen(true);
  };

  const openDetailDialog = (order: unknown, index?: number) => {
      setSelectedOrder(order as Order);
    if (index !== undefined) {
      setCurrentOrderIndex(index);
    } else {
      const orderRecord = order as Record<string, unknown>;
      const foundIndex = orders.findIndex(o => o.id === orderRecord.id || o._id === orderRecord._id);
      setCurrentOrderIndex(foundIndex >= 0 ? foundIndex : 0);
    }
    setIsDetailOpen(true);
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatDateShort = (date: string | Date | undefined) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const getFirstProjectImage = (order: unknown): string => {
    const orderRecord = order as Record<string, unknown>;
    if (Array.isArray(orderRecord.projects) && orderRecord.projects.length > 0) {
      const firstProject = orderRecord.projects[0] as Record<string, unknown>;
      return String(firstProject.image || '');
    }
    const orderRaw = orderRecord.raw as Record<string, unknown> | undefined;
    if (orderRaw?.SanPham && Array.isArray(orderRaw.SanPham) && orderRaw.SanPham.length > 0) {
      const firstProject = orderRaw.SanPham[0] as Record<string, unknown>;
      if (isProjectDocument(firstProject.IdSanPham as OrderProject['IdSanPham'])) {
        return String((firstProject.IdSanPham as Project).HinhAnhChinh || '');
      }
      const fallbackImage = (firstProject as Record<string, unknown>).HinhAnhChinh;
      return typeof fallbackImage === 'string' ? fallbackImage : '';
    }
    return '';
  };

  const getFirstProjectName = (order: unknown): string => {
    const orderRecord = order as Record<string, unknown>;
    if (Array.isArray(orderRecord.projects) && orderRecord.projects.length > 0) {
      const firstProject = orderRecord.projects[0] as Record<string, unknown>;
      return String(firstProject.name || 'Đồ án');
    }
    const orderRaw = orderRecord.raw as Record<string, unknown> | undefined;
    if (orderRaw?.SanPham && Array.isArray(orderRaw.SanPham) && orderRaw.SanPham.length > 0) {
      const firstProject = orderRaw.SanPham[0] as Record<string, unknown>;
      if (isProjectDocument(firstProject.IdSanPham as OrderProject['IdSanPham'])) {
        return String((firstProject.IdSanPham as Project).TenSanPham || 'Đồ án');
      }
      const fallbackName = (firstProject as Record<string, unknown>).TenSanPham;
      return typeof fallbackName === 'string' && fallbackName.trim()
        ? fallbackName
        : 'Đồ án';
    }
    return 'Đơn hàng';
  };

  const navigateOrder = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentOrderIndex > 0) {
      openDetailDialog(orders[currentOrderIndex - 1], currentOrderIndex - 1);
    } else if (direction === 'next' && currentOrderIndex < orders.length - 1) {
      openDetailDialog(orders[currentOrderIndex + 1], currentOrderIndex + 1);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Vui lòng đăng nhập</h2>
              <p className="text-muted-foreground mb-4">Bạn cần đăng nhập để xem đơn hàng của mình</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const filteredOrders = getFilteredOrders();
  const ordersByStatus = getOrdersByStatus();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Đơn hàng của tôi</h1>
          <p className="text-muted-foreground">Xem và quản lý đơn hàng của bạn</p>
        </div>

        {/* Status Filter Tabs */}
        {!loading && orders.length > 0 && (
          <div className="mb-6">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">
                  Tất cả ({ordersByStatus.all})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Chờ xác nhận ({ordersByStatus.pending})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Đã xác nhận ({ordersByStatus.confirmed})
                </TabsTrigger>
                <TabsTrigger value="shipping">
                  Đang giao ({ordersByStatus.shipping})
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  Đã giao ({ordersByStatus.delivered})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Đã hủy ({ordersByStatus.cancelled})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào trong hệ thống</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Không có đơn hàng</h2>
              <p className="text-muted-foreground mb-4">
                Không có đơn hàng nào ở trạng thái "{statusFilter === 'pending' ? 'Chờ xác nhận' : statusFilter === 'confirmed' ? 'Đã xác nhận' : statusFilter === 'shipping' ? 'Đang giao' : statusFilter === 'delivered' ? 'Đã giao' : 'Đã hủy'}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              const firstProjectImage = getFirstProjectImage(order);
              const firstProjectName = getFirstProjectName(order);
              
              return (
                <Card key={order._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Header with image and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {firstProjectImage && (
                          <img
                            src={getCloudinaryProjectImageUrl(firstProjectImage)}
                            alt={firstProjectName}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        )}
                        <div>
                          <h3 className="text-2xl font-bold">Đơn #{order.MaDonHang || order._id?.slice(-6)}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.statusCode || order.raw?.TrangThai || '')}
                      </div>
                    </div>

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Đồ án</p>
                        <p className="font-medium">{firstProjectName}</p>
                        {(order.projects?.length > 1 || order.raw?.SanPham?.length > 1) && (
                          <p className="text-xs text-muted-foreground">+{(order.projects?.length || order.raw?.SanPham?.length || 1) - 1} đồ án khác</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Ngày đặt</p>
                        <p className="font-medium">{formatDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Phương thức</p>
                        <p className="font-medium">
                          {order.paymentMethod || (order.raw?.PhuongThucThanhToan === 'COD' ? 'Thanh toán khi nhận' : order.raw?.PhuongThucThanhToan)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Tổng tiền</p>
                        <p className="font-semibold text-lg">{formatCurrency(order.total || order.raw?.TongTien || 0)}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const originalIndex = orders.findIndex(o => o.id === order.id || o._id === order._id);
                          openDetailDialog(order, originalIndex >= 0 ? originalIndex : 0);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Chi tiết
                      </Button>
                      {canCancelOrder(order) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openCancelDialog(order)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Hủy đơn
                        </Button>
                      )}
                    </div>

                    {/* Quick Timeline Preview */}
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-2">Lịch sử đơn hàng</p>
                      <div className="space-y-2">
                        {getOrderHistory(order).slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                            <div className="flex-1">
                              <p className="font-medium">{item.event}</p>
                              <p className="text-muted-foreground">{formatDateShort(item.timestamp as string | Date | undefined)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Dialog with Tabs */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {getFirstProjectImage(selectedOrder) && (
                      <img
                        src={getCloudinaryProjectImageUrl(getFirstProjectImage(selectedOrder))}
                        alt={getFirstProjectName(selectedOrder)}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    )}
                    <div>
                      <DialogTitle className="text-3xl font-bold">
                        Đơn #{selectedOrder.MaDonHang || selectedOrder._id?.slice(-6)}
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        {getFirstProjectName(selectedOrder)}
                      </DialogDescription>
                    </div>
                  </div>
                      <div className="text-right">
                    {(() => {
                      const orderRecord = selectedOrder as unknown as Record<string, unknown>;
                      return getStatusBadge(String(orderRecord.statusCode || (orderRecord.raw as Record<string, unknown> | undefined)?.TrangThai || ''));
                    })()}
                  </div>
                </div>
              </DialogHeader>

              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-4 my-4 text-sm border-b pb-4">
                <div>
                  <p className="text-muted-foreground mb-1">Đồ án</p>
                  <p className="font-medium">{getFirstProjectName(selectedOrder)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Ngày đặt</p>
                  <p className="font-medium">{formatDate((selectedOrder as unknown as Record<string, unknown>).createdAt as string | Date | undefined)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Phương thức thanh toán</p>
                  <p className="font-medium">
                    {(() => {
                      const orderRecord = selectedOrder as unknown as Record<string, unknown>;
                      const orderRaw = orderRecord.raw as Record<string, unknown> | undefined;
                      return String(orderRecord.paymentMethod || (orderRaw?.PhuongThucThanhToan === 'COD' ? 'Thanh toán khi nhận' : orderRaw?.PhuongThucThanhToan) || '');
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Địa chỉ</p>
                  <p className="font-medium line-clamp-1">
                    {(() => {
                      const orderRecord = selectedOrder as unknown as Record<string, unknown>;
                      const orderRaw = orderRecord.raw as Record<string, unknown> | undefined;
                      return String(orderRecord.address || (orderRaw?.ThongTinNhanHang
                        ? `${(orderRaw.ThongTinNhanHang as Record<string, unknown>).DiaChiChiTiet}, ${(orderRaw.ThongTinNhanHang as Record<string, unknown>).QuanHuyen}, ${(orderRaw.ThongTinNhanHang as Record<string, unknown>).TinhThanh}`
                        : typeof orderRaw?.DiaChi === 'string'
                        ? orderRaw.DiaChi
                        : '—'));
                    })()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất chi tiết
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Yêu cầu xác nhận
                </Button>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="history">Lịch sử</TabsTrigger>
                  <TabsTrigger value="items">Đồ án</TabsTrigger>
                  <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
                  <TabsTrigger value="receiver">Người nhận</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="mt-4">
                  <div className="space-y-4">
                    {getOrderHistory(selectedOrder).map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          {index < getOrderHistory(selectedOrder).length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-semibold mb-1">{item.event}</p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatDateShort(item.timestamp as string | Date | undefined)}
                          </p>
                          {item.details && item.details.length > 0 && (
                            <div className="space-y-1">
                              {item.details.map((detail, idx) => (
                                <p key={idx} className="text-sm text-muted-foreground">
                                  {detail}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="items" className="mt-4">
                  <div className="space-y-3">
                    {(() => {
                      const orderRecord = selectedOrder as unknown as Record<string, unknown>;
                      const projects = (Array.isArray(orderRecord.projects) ? orderRecord.projects : []) || 
                        (Array.isArray((orderRecord.raw as Record<string, unknown> | undefined)?.SanPham) ? (orderRecord.raw as Record<string, unknown>).SanPham : []) || 
                        [];
                      return projects.map((project: unknown, index: number) => {
                        // Ưu tiên dùng formatted projects từ hook
                        const orderProjects = Array.isArray(orderRecord.projects) ? orderRecord.projects : [];
                        if (orderProjects.length > index) {
                          const p = orderProjects[index];
                        return (
                          <div key={index} className="flex gap-4 p-3 border rounded-lg">
                            {p.image && (
                              <img
                                src={getCloudinaryProjectImageUrl(p.image)}
                                alt={p.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{p.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Số lượng: {p.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatCurrency(p.price * p.quantity)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(p.price)}/đồ án
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Fallback về raw data
                      const projectRecord = project as Record<string, unknown>;
                      const projectEntity = isProjectDocument(projectRecord.IdSanPham as OrderProject['IdSanPham']) ? (projectRecord.IdSanPham as Project) : null;
                      const projectName = (projectEntity as Record<string, unknown> | null)?.TenSanPham || String(projectRecord.TenSanPham || 'Đồ án');
                      const projectImage = (projectEntity as Record<string, unknown> | null)?.HinhAnhChinh
                        || (typeof projectRecord.HinhAnhChinh === 'string' ? projectRecord.HinhAnhChinh : '');

                      const selectedDungTich = projectRecord.SelectedDungTich as Record<string, unknown> | undefined;
                      return (
                        <div key={index} className="flex gap-4 p-3 border rounded-lg">
                          {projectImage && (
                            <img
                              src={getCloudinaryProjectImageUrl(String(projectImage))}
                              alt={String(projectName)}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{String(projectName)}</h4>
                            {selectedDungTich && (
                              <p className="text-sm text-muted-foreground">
                                Bao gồm: {String(selectedDungTich.label || `${selectedDungTich.value || ''}ml`)}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Số lượng: {Number(projectRecord.SoLuong || 1)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(Number(projectRecord.Gia || 0) * Number(projectRecord.SoLuong || 1))}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(Number(projectRecord.Gia || 0))}/đồ án
                            </p>
                          </div>
                        </div>
                      );
                    });
                    })()}
                  </div>
                </TabsContent>

                <TabsContent value="shipping" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Thông tin vận chuyển</Label>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const orderRecord = selectedOrder as unknown as Record<string, unknown>;
                          const orderRaw = orderRecord.raw as Record<string, unknown> | undefined;
                          return (
                            <>
                              <p><strong>Phương thức:</strong> {String(orderRecord.paymentMethod || orderRaw?.PhuongThucThanhToan || '')}</p>
                              <p><strong>Phí vận chuyển:</strong> {formatCurrency(Number(orderRecord.shippingFee || orderRaw?.PhiVanChuyen || 0))}</p>
                              <p><strong>Trạng thái:</strong> {getStatusBadge(String(orderRecord.statusCode || orderRaw?.TrangThai || ''))}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="receiver" className="mt-4">
                  <div className="space-y-4">
                    {(() => {
                      const orderRecord = selectedOrder as unknown as Record<string, unknown>;
                      return (orderRecord.raw as Record<string, unknown> | undefined)?.ThongTinNhanHang ? (
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const orderRaw = (selectedOrder as unknown as Record<string, unknown>).raw as Record<string, unknown> | undefined;
                          const thongTinNhanHang = orderRaw?.ThongTinNhanHang as Record<string, unknown> | undefined;
                          return (
                            <>
                              <p><strong>Họ tên:</strong> {String(thongTinNhanHang?.HoTen || '')}</p>
                              <p><strong>Số điện thoại:</strong> {String(thongTinNhanHang?.SoDienThoai || '')}</p>
                              {thongTinNhanHang?.Email && (
                                <p><strong>Email:</strong> {String(thongTinNhanHang.Email)}</p>
                              )}
                              <p><strong>Địa chỉ:</strong> {String(thongTinNhanHang?.DiaChiChiTiet || '')}</p>
                              <p>
                                {[
                                  thongTinNhanHang?.PhuongXa,
                                  thongTinNhanHang?.QuanHuyen,
                                  thongTinNhanHang?.TinhThanh,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const orderRecord = selectedOrder as unknown as Record<string, unknown>;
                            return String(orderRecord.address || (() => {
                              const orderRaw = orderRecord.raw as Record<string, unknown> | undefined;
                              return typeof orderRaw?.DiaChi === 'string' ? orderRaw.DiaChi : '—';
                            })());
                          })()}
                        </p>
                      );
                    })()}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Đơn {currentOrderIndex + 1} / {orders.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateOrder('prev')}
                    disabled={currentOrderIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Đơn trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateOrder('next')}
                    disabled={currentOrderIndex === orders.length - 1}
                  >
                    Đơn tiếp theo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Đóng
                </Button>
                {canCancelOrder(selectedOrder) && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailOpen(false);
                      openCancelDialog(selectedOrder);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy đơn hàng
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này? Vui lòng nhập lý do hủy đơn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Lý do hủy đơn</Label>
              <Input
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCancelDialogOpen(false);
              setCancelReason('');
              setCancellingOrderId(null);
            }}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
