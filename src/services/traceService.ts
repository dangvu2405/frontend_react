import axiosInstance from './axios';
import type {
  TraceEvent,
  TraceCertificate,
  TraceProduct,
  TraceTransport,
  OnChainProof,
  ProductTrace,
  TraceLookupParams
} from '@/types/models';

class TraceService {
  /**
   * Lấy thông tin trace của sản phẩm theo ID
   */
  async getProductTrace(productId: string): Promise<ProductTrace> {
    const response = await axiosInstance.get(`/api/products/${productId}/trace`);
    return response.data.data;
  }

  /**
   * Tra cứu sản phẩm bằng mã sản phẩm hoặc mã lô
   */
  async lookupTrace(params: TraceLookupParams): Promise<ProductTrace> {
    const response = await axiosInstance.get('/api/trace/lookup', { params });
    return response.data.data;
  }

  /**
   * Verify checksum của QR code
   */
  verifyChecksum(checksum: string): boolean {
    // Frontend validation (optional)
    // Backend sẽ verify chính xác hơn
    return checksum.length === 32; // Basic validation
  }

  /**
   * Format blockchain address
   */
  formatAddress(address: string | null): string {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format transaction hash
   */
  formatTxHash(hash: string | null): string {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

  /**
   * Kiểm tra certificate còn hạn không
   */
  isCertificateValid(expiresAt: string): boolean {
    return new Date(expiresAt) > new Date();
  }

  /**
   * Get event icon
   */
  getEventIcon(eventType: string): string {
    const icons: Record<string, string> = {
      manufactured: '🏭',
      shipped: '🚢',
      delivered: '📦',
      inspected: '🔍',
      certified: '✅',
      imported: '🛃',
      exported: '🛫',
      stored: '🏪',
    };
    return icons[eventType] || '📌';
  }

  /**
   * Get event color
   */
  getEventColor(eventType: string): string {
    const colors: Record<string, string> = {
      manufactured: 'blue',
      shipped: 'purple',
      delivered: 'green',
      inspected: 'orange',
      certified: 'teal',
      imported: 'cyan',
      exported: 'indigo',
      stored: 'gray',
    };
    return colors[eventType] || 'gray';
  }
}

export default new TraceService();