import axiosInstance from './axios';
import type { ApiItemResponse } from '@/types/models';

type PaymentMethod = 'cod' | 'vnpay' | 'momo';

interface PaymentApiResponse<T = any> {
  success?: boolean;
  message?: string;
  metadata?: T;
  data?: T;
}

export const paymentService = {
  createPayment: async <T = any>(method: PaymentMethod) => {
    const response = await axiosInstance.post<ApiItemResponse<T> & PaymentApiResponse<T>>(
      '/payment/create',
      { typePayment: method }
    );
    const payload = response.data as PaymentApiResponse<T>;
    return payload;
  },
};


