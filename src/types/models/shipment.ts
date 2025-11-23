/**
 * Shipment models
 * Định nghĩa các types liên quan đến vận chuyển/giao hàng
 */

import type { BaseDocument, ObjectId } from './common';
import type { Order } from './order';

/**
 * ShipmentHistoryEntry - Một entry trong lịch sử vận chuyển
 */
export interface ShipmentHistoryEntry {
  TrangThai: string;    // Trạng thái
  MoTa?: string;         // Mô tả
  ThoiGian: string;      // Thời gian
  DiaDiem?: string;      // Địa điểm
}

/**
 * Shipment - Thông tin vận chuyển đơn hàng
 */
export interface Shipment extends BaseDocument {
  MaDonHang: ObjectId | Order;  // ID đơn hàng
  DonViVanChuyen:               // Đơn vị vận chuyển
    | 'Giao Hàng Nhanh'
    | 'Giao Hàng Tiết Kiệm'
    | 'J&T Express'
    | 'Viettel Post'
    | 'VNPost'
    | 'Ninja Van'
    | 'Shopee Express'
    | 'Grab Express'
    | string;
  MaVanDon: string;             // Mã vận đơn
  PhiShip: number;              // Phí ship
  TrangThai: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned'; // Trạng thái
  NguoiGiao?: {                 // Thông tin người giao hàng
    HoTen?: string;
    SoDienThoai?: string;
  };
  DiaChiGiao: string;           // Địa chỉ giao hàng
  NguoiNhan: {                  // Thông tin người nhận
    HoTen: string;
    SoDienThoai: string;
  };
  ThoiGianLayHang?: string | null;      // Thời gian lấy hàng
  ThoiGianGiaoDuKien?: string | null;   // Thời gian giao dự kiến
  ThoiGianGiaoThucTe?: string | null;   // Thời gian giao thực tế
  LichSuTrangThai: ShipmentHistoryEntry[]; // Lịch sử trạng thái
  GhiChu?: string;              // Ghi chú
  LyDoThatBai?: string;         // Lý do thất bại (nếu có)
}


