/**
 * Trace và Supply Chain service types
 * Định nghĩa các types liên quan đến truy xuất nguồn gốc sản phẩm và chuỗi cung ứng
 */

// ==========================
// TRACE SERVICE TYPES
// ==========================

/**
 * TraceEvent - Sự kiện trong quá trình sản xuất/vận chuyển sản phẩm
 */
export interface TraceEvent {
  id: string;                    // ID sự kiện
  type: string;                   // Loại sự kiện (manufactured, shipped, delivered, etc.)
  title: string;                  // Tiêu đề sự kiện
  description: string;            // Mô tả chi tiết
  location: string | null;        // Địa điểm xảy ra
  actor: string | null;           // Người/đơn vị thực hiện
  timestamp: string;              // Thời gian xảy ra
  transactionHash: string | null; // Hash giao dịch blockchain (nếu có)
  blockNumber: number | null;     // Số block trên blockchain (nếu có)
}

/**
 * TraceCertificate - Chứng nhận/chứng chỉ của sản phẩm
 */
export interface TraceCertificate {
  id: string;                     // ID chứng nhận
  name: string;                   // Tên chứng nhận
  issuer: string;                 // Đơn vị cấp
  issuedAt: string;               // Ngày cấp
  expiresAt: string;              // Ngày hết hạn
  ipfsHash: string | null;        // IPFS hash (nếu lưu trên IPFS)
  verificationUrl: string | null; // URL xác minh
  status?: 'VALID' | 'EXPIRED';  // Trạng thái
}

/**
 * TraceProduct - Thông tin sản phẩm trong hệ thống trace
 */
export interface TraceProduct {
  id: string;           // ID sản phẩm
  name: string;         // Tên sản phẩm
  sku: string | null;   // SKU (Stock Keeping Unit)
  category: string | null; // Danh mục
  batchId: string;      // ID lô hàng
  createdAt: string;    // Ngày tạo
  updatedAt: string;    // Ngày cập nhật
}

/**
 * TraceTransport - Thông tin vận chuyển sản phẩm
 */
export interface TraceTransport {
  status: string;                   // Trạng thái vận chuyển
  carrier: string;                  // Đơn vị vận chuyển
  trackingCode: string;             // Mã tracking
  lastUpdated: string;              // Cập nhật lần cuối
  pickupTime: string | null;        // Thời gian lấy hàng
  eta: string | null;               // Thời gian dự kiến giao hàng
  deliveredAt: string | null;       // Thời gian giao hàng thực tế
  history: Array<{                  // Lịch sử vận chuyển
    id: string;
    status: string;
    description: string;
    location: string | null;
    timestamp: string;
  }>;
}

/**
 * OnChainProof - Bằng chứng trên blockchain
 */
export interface OnChainProof {
  latestTransaction: string | null; // Giao dịch mới nhất
  latestBlock: number | null;       // Block mới nhất
  merkleRoot: string | null;         // Merkle root
  explorerUrl: string;               // URL blockchain explorer
  blockNumber?: number;              // Số block
  from?: string;                     // Địa chỉ gửi
  gasUsed?: string;                  // Gas đã sử dụng
  status?: string;                   // Trạng thái giao dịch
  txExplorerUrl?: string;            // URL xem giao dịch
  blockExplorerUrl?: string;         // URL xem block
  addressExplorerUrl?: string;       // URL xem địa chỉ
  timestamp?: string;                // Timestamp
}

/**
 * ProductTrace - Thông tin truy xuất nguồn gốc đầy đủ của sản phẩm
 */
export interface ProductTrace {
  verified: boolean;                // Đã xác minh hay chưa
  reason?: string;                  // Lý do (nếu không verified)
  product: TraceProduct;            // Thông tin sản phẩm
  transport: TraceTransport | null; // Thông tin vận chuyển
  events: TraceEvent[];             // Danh sách sự kiện
  certificates: TraceCertificate[]; // Danh sách chứng nhận
  onChainProof: OnChainProof;       // Bằng chứng blockchain
  qr: {                             // Thông tin QR code
    url: string;                    // URL QR code
    payload: {                      // Dữ liệu trong QR
      productId: string;
      batchId: string;
      checksum: string;
    };
  };
}

/**
 * TraceLookupParams - Tham số tra cứu sản phẩm
 * Dùng cho API GET /api/trace/lookup
 */
export interface TraceLookupParams {
  productCode?: string; // Mã sản phẩm
  batchCode?: string;   // Mã lô hàng
}

// ==========================
// SUPPLY CHAIN SERVICE TYPES
// ==========================

/**
 * TraceTransportHistoryEntry - Một entry trong lịch sử vận chuyển
 */
export interface TraceTransportHistoryEntry {
  id: string;                    // ID entry
  status: string;                 // Trạng thái
  description?: string | null;    // Mô tả
  location?: string | null;        // Địa điểm
  timestamp?: string | null;      // Thời gian
}

/**
 * TraceTransportInfo - Thông tin vận chuyển (phiên bản mở rộng)
 */
export interface TraceTransportInfo {
  status?: string | null;         // Trạng thái
  carrier?: string | null;        // Đơn vị vận chuyển
  trackingCode?: string | null;   // Mã tracking
  lastUpdated?: string | null;    // Cập nhật lần cuối
  pickupTime?: string | null;     // Thời gian lấy hàng
  eta?: string | null;            // Thời gian dự kiến
  deliveredAt?: string | null;    // Thời gian giao hàng
  history: TraceTransportHistoryEntry[]; // Lịch sử
}

/**
 * TraceOnChainProof - Bằng chứng blockchain (phiên bản đơn giản)
 */
export interface TraceOnChainProof {
  latestTransaction?: string | null; // Giao dịch mới nhất
  latestBlock?: number | null;      // Block mới nhất
  merkleRoot?: string | null;        // Merkle root
  explorerUrl?: string | null;       // URL explorer
}

/**
 * TraceQrPayload - Dữ liệu trong QR code
 */
export interface TraceQrPayload {
  productId?: string | null;  // ID sản phẩm
  batchId?: string | null;    // ID lô hàng
  checksum?: string | null;   // Checksum để verify
}

/**
 * TraceQrInfo - Thông tin QR code
 */
export interface TraceQrInfo {
  url: string;              // URL QR code image
  payload: TraceQrPayload;   // Dữ liệu trong QR
}

/**
 * ProductTraceData - Dữ liệu truy xuất nguồn gốc (phiên bản supply chain)
 */
export interface ProductTraceData {
  product: TraceProduct;              // Thông tin sản phẩm
  transport: TraceTransportInfo | null; // Thông tin vận chuyển
  certificates: TraceCertificate[];   // Danh sách chứng nhận
  events: TraceEvent[];               // Danh sách sự kiện
  onChainProof: TraceOnChainProof;    // Bằng chứng blockchain
  qr: TraceQrInfo;                    // Thông tin QR code
}

/**
 * InitProductPayload - Payload khởi tạo sản phẩm trong hệ thống trace
 * Dùng cho API POST /api/supply-chain/admin/products/:id/init
 */
export interface InitProductPayload {
  batchId?: string; // ID lô hàng
  sku?: string;     // SKU sản phẩm
}

/**
 * RecordEventPayload - Payload ghi nhận sự kiện
 * Dùng cho API POST /api/supply-chain/admin/products/:id/events
 */
export interface RecordEventPayload {
  eventType: string;    // Loại sự kiện
  description: string;  // Mô tả
  location?: string;    // Địa điểm
  ipfsHash?: string;    // IPFS hash (nếu lưu trên IPFS)
}

/**
 * IssueCertificatePayload - Payload cấp chứng nhận
 * Dùng cho API POST /api/supply-chain/admin/products/:id/certificates
 */
export interface IssueCertificatePayload {
  name: string;         // Tên chứng nhận
  issuer: string;       // Đơn vị cấp
  ipfsHash?: string;   // IPFS hash
  expiresAt?: number;  // Thời gian hết hạn (Unix timestamp in seconds)
}

