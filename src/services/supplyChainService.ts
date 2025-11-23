import axiosInstance from './axios';
import type {
  TraceProduct,
  TraceEvent,
  TraceCertificate,
  TraceTransportHistoryEntry,
  TraceTransportInfo,
  TraceOnChainProof,
  TraceQrPayload,
  TraceQrInfo,
  ProductTraceData,
  InitProductPayload,
  RecordEventPayload,
  IssueCertificatePayload
} from '@/types/models';

export const supplyChainService = {
  getProductTrace: async (productId: string): Promise<ProductTraceData> => {
    const response = await axiosInstance.get(`/api/supply-chain/products/${productId}/trace`);
    return (response as any)?.data;
  },

  lookupTrace: async (params: { productCode?: string; batchCode?: string }): Promise<ProductTraceData> => {
    const response = await axiosInstance.get('/api/supply-chain/lookup', { params });
    return (response as any)?.data;
  },

  // Admin functions
  initProduct: async (productId: string, payload: InitProductPayload) => {
    const response = await axiosInstance.post(`/api/supply-chain/admin/products/${productId}/init`, payload);
    return (response as any)?.data;
  },

  recordEvent: async (productId: string, payload: RecordEventPayload) => {
    const response = await axiosInstance.post(`/api/supply-chain/admin/products/${productId}/events`, payload);
    return (response as any)?.data;
  },

  issueCertificate: async (productId: string, payload: IssueCertificatePayload) => {
    const response = await axiosInstance.post(`/api/supply-chain/admin/products/${productId}/certificates`, payload);
    return (response as any)?.data;
  },
};

