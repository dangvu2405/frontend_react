import axiosInstance from "./axios";
import type { ApiItemResponse, Cart, CheckoutResponse } from "@/types/models";
import type { PaymentResponse } from "@/types/models/payment";

export interface UpdateCartData {
  items: Array<{
    id: string;
    quantity: number;
    tenSP?: string;
  }>;
}

export interface CheckoutPayload {
  DiaChi?: string;
  SanPham: Array<{
    MaSanPham: string;
    SoLuong: number;
    Gia?: number;
    TenSanPham?: string;
    HinhAnhChinh?: string;
  }>;
  TongTien: number;
  PhuongThucThanhToan: string;
  GhiChu?: string;
  Voucher?: string | null;
  ThongTinNhanHang?: {
    HoTen: string;
    Email: string;
    SoDienThoai: string;
    DiaChiChiTiet: string;
    PhuongXa: string;
    QuanHuyen: string;
    TinhThanh: string;
  };
}

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const response = await axiosInstance.get<ApiItemResponse<{ cart: Cart }>>('/cart/get-cart');
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: { cart } }
    if (responseData && responseData.data) {
      if (typeof responseData.data === 'object' && 'cart' in responseData.data) {
        return (responseData.data as any).cart as Cart;
      }
      if (typeof responseData.data === 'object' && 'Items' in responseData.data) {
        return responseData.data as Cart;
      }
    }
    
    return { Items: [] } as Cart;
  },
  
  updateCart: async (data: UpdateCartData) => {
    const response = await axiosInstance.post<ApiItemResponse<{ cart: Cart }>>('/cart/update-cart', data);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: { cart } }
    if (responseData && responseData.data) {
      if (typeof responseData.data === 'object' && 'cart' in responseData.data) {
        return (responseData.data as any).cart as Cart;
      }
      return responseData.data as Cart;
    }
    
    return { Items: [] } as Cart;
  },
  
  checkout: async (data: CheckoutPayload): Promise<CheckoutResponse> => {
    const response = await axiosInstance.post<ApiItemResponse<CheckoutResponse>>('/cart/checkout', data);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: { orderId, donHang, requiresPayment, paymentMethod } }
    if (responseData && responseData.data) {
      return responseData.data as CheckoutResponse;
    }
    
    return responseData as unknown as CheckoutResponse;
  },
  
  createVNPayUrl: async (data: { orderId: string; amount: number; orderDescription?: string; returnUrl?: string }): Promise<PaymentResponse> => {
    const response = await axiosInstance.post<ApiItemResponse<PaymentResponse>>('/payment/vnpay/create-payment-url', data);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: { paymentUrl, txnRef, expireDate, params } }
    if (responseData && responseData.data) {
      return responseData.data as PaymentResponse;
    }
    
    return responseData as unknown as PaymentResponse;
  },
  
  createVNPayQR: async (data: { orderId: string; amount: number; orderInfo?: string; returnUrl?: string }): Promise<PaymentResponse> => {
    const response = await axiosInstance.post<ApiItemResponse<PaymentResponse>>('/payment/vnpay/create-qr', data);
    const responseData = response.data;
    
    // ✅ Backend trả về: { success, message, data: { paymentUrl, qrCode, txnRef, expireDate, params } }
    if (responseData && responseData.data) {
      return responseData.data as PaymentResponse;
    }
    
    return responseData as unknown as PaymentResponse;
  }
};

