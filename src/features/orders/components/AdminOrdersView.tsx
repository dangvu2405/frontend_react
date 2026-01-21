import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { Order } from '@/types/models';
import { ordersService } from '@/services/ordersService';
// import { LoadingState } from '@/shared/components';

const STATUS_LABELS: Record<Order['TrangThai'], string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<Order['TrangThai'], string> = {
  pending: 'text-amber-600 bg-amber-100',
  confirmed: 'text-blue-600 bg-blue-100',
  shipping: 'text-purple-600 bg-purple-100',
  delivered: 'text-emerald-600 bg-emerald-100',
  cancelled: 'text-red-600 bg-red-100',
};

export const AdminOrdersView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | Order['TrangThai']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { orders: list, pagination } = await ordersService.getOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setOrders(list);
      const paginationRecord = pagination as Record<string, unknown> | undefined;
      setTotalPages(typeof paginationRecord?.totalPages === 'number' ? paginationRecord.totalPages : 1);
    } catch (error: unknown) {
      const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const handleUpdateStatus = async (orderId: string, status: Order['TrangThai']) => {
    try {
      await ordersService.updateOrderStatus(orderId, status);
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch (error: unknown) {
      const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể cập nhật trạng thái');
    }
  };

  const filteredOrders = useMemo(() => orders, [orders]);

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Quản lý đơn hàng</CardTitle>
            <CardDescription>Theo dõi trạng thái đơn hàng và cập nhật nhanh chóng.</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setCurrentPage(1);
            setStatusFilter(value as typeof statusFilter);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Đang tải danh sách đơn hàng...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Không có đơn hàng phù hợp.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mã đơn</th>
                    <th className="px-4 py-3 font-semibold">Khách hàng</th>
                    <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                    <th className="px-4 py-3 font-semibold text-right">Tổng tiền</th>
                    <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-4 font-medium">{order.MaDonHang || order._id}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{order.IdKhachHang?.HoTen || 'Khách lẻ'}</div>
                        <div className="text-xs text-muted-foreground">{order.IdKhachHang?.Email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {order.SanPham.slice(0, 2).map((item, index) => (
                            <div key={`${order._id}-${index}`} className="text-muted-foreground">
                              {item.TenSanPham} × {item.SoLuong}
                            </div>
                          ))}
                          {order.SanPham.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{order.SanPham.length - 2} sản phẩm khác</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-primary">
                        {order.TongTien.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="px-4 py-4">
                        {format(new Date(order.createdAt || new Date()), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.TrangThai]}`}>
                          {STATUS_LABELS[order.TrangThai]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Select onValueChange={(value) => handleUpdateStatus(order._id, value as Order['TrangThai'])}>
                          <SelectTrigger className="w-40 text-xs">
                            <SelectValue placeholder="Cập nhật" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="border-t border-border/60 px-4 py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === index + 1}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage(index + 1);
                      }}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminOrdersView;

