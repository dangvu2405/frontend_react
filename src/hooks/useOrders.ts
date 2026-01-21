import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import axiosInstance from '@/services/axios';
import { toast } from 'sonner';
import type { Order } from '@/types/models';

/**
 * Format order data từ backend sang format thống nhất cho frontend
 */
export const formatOrderForDisplay = (order: Order) => {
  return {
    _id: order._id,
    id: order._id,
    MaDonHang: order.MaDonHang || order._id?.slice(-8).toUpperCase(),
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '',
    status: order.TrangThai === 'pending'
      ? 'Chờ xác nhận'
      : order.TrangThai === 'confirmed'
      ? 'Đã xác nhận'
      : order.TrangThai === 'shipping'
      ? 'Đang giao hàng'
      : order.TrangThai === 'delivered'
      ? 'Đã giao hàng'
      : order.TrangThai === 'cancelled'
      ? 'Đã hủy'
      : order.TrangThai,
    statusCode: order.TrangThai,
    total: order.TongTien || 0,
    products: order.SanPham?.map((sp: unknown) => {
      const spRecord = sp as Record<string, unknown>;
      const maSanPham = spRecord.MaSanPham as Record<string, unknown> | string | undefined;
      const idSanPham = spRecord.IdSanPham as Record<string, unknown> | undefined;
      return {
        id: (typeof maSanPham === 'object' && maSanPham?._id ? maSanPham._id : maSanPham) || spRecord.id,
        name: String(spRecord.TenSanPham || idSanPham?.TenSanPham || 'Sản phẩm'),
        quantity: Number(spRecord.SoLuong || spRecord.quantity || 1),
        price: Number(spRecord.Gia || spRecord.price || 0),
        image: String(spRecord.HinhAnhChinh || idSanPham?.HinhAnhChinh || ''),
        category: String(spRecord.loaiSP || ''),
      };
    }) || [],
    address: order.DiaChi || (order.ThongTinNhanHang 
      ? `${order.ThongTinNhanHang.DiaChiChiTiet}, ${order.ThongTinNhanHang.QuanHuyen}, ${order.ThongTinNhanHang.TinhThanh}`
      : ''),
    shippingFee: order.PhiVanChuyen || 0,
    paymentMethod: order.PhuongThucThanhToan === 'COD'
      ? 'Thanh toán khi nhận hàng'
      : order.PhuongThucThanhToan,
    note: order.GhiChu || '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    // Giữ nguyên dữ liệu gốc để dùng khi cần
    raw: order,
  };
};

/**
 * Hook để fetch và quản lý đơn hàng với React Query
 */
export const useOrders = () => {
  return useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const orders = await userService.getOrders();
      return orders.map(formatOrderForDisplay);
    },
    staleTime: 30_000, // 30 giây
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook để hủy đơn hàng và tự động refresh danh sách
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      await axiosInstance.delete(`/user/orderUser/${orderId}`, {
        data: { reason: reason || 'Khách hàng yêu cầu hủy đơn hàng' },
      });
    },
    onSuccess: () => {
      // Invalidate và refetch danh sách đơn hàng
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      toast.success('Yêu cầu hủy đơn hàng đã được gửi. Vui lòng chờ admin xác nhận.');
    },
    onError: (error: unknown) => {
      const errorRecord = error as Record<string, unknown>;
      const errorMsg = (((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined) ||
        (errorRecord?.message as string | undefined);
      toast.error(errorMsg || 'Không thể hủy đơn hàng');
    },
  });
};

