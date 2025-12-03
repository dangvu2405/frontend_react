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
    id: order._id || order.id,
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
    products: order.SanPham?.map((sp: any) => ({
      id: sp.MaSanPham?._id || sp.MaSanPham || sp.id,
      name: sp.TenSanPham || sp.IdSanPham?.TenSanPham || 'Sản phẩm',
      quantity: sp.SoLuong || sp.quantity || 1,
      price: sp.Gia || sp.price || 0,
      image: sp.HinhAnhChinh || sp.IdSanPham?.HinhAnhChinh || '',
      category: sp.loaiSP || '',
    })) || [],
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
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể hủy đơn hàng');
    },
  });
};

