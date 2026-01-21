import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { storage, type CartItem } from '@/utils/storage';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import PaymentSuccess from '@/components/payment-sucess';
import PaymentFail from '@/components/payment-fail';
import type { CheckoutResponse, UserAddress } from '@/types/models';
import type { CheckoutPayload } from '@/services/cartService';
import { paymentService } from '@/services/paymentService';
import { 
  getAllProvinces, 
  getDistrictsByProvince, 
  getWardsByDistrict 
} from '@/constants/vietnam-addresses';

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'BANK' | 'CARD' | 'VNPAY' | 'MOMO'>('COD');
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'fail' | 'processing'>('idle');
  const [newAddress, setNewAddress] = useState<UserAddress>({
    HoTen: '',
    SoDienThoai: '',
    DiaChiChiTiet: '',
    PhuongXa: '',
    QuanHuyen: '',
    TinhThanh: '',
    MacDinh: false,
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscountPct, setVoucherDiscountPct] = useState<number>(0);
  const selectedAddress = selectedAddressId
    ? addresses.find((addr) => addr._id === selectedAddressId)
    : null;

  const extractPaymentRedirectUrl = (metadata: unknown): string | null => {
    if (!metadata) return null;
    if (typeof metadata === 'string') {
      return metadata.startsWith('http') ? metadata : null;
    }

    const candidates = [
      'paymentUrl',
      'payUrl',
      'deeplink',
      'deeplinkUrl',
      'shortLink',
      'orderUrl',
      'checkoutUrl',
      'qrCodeUrl',
      'url',
    ];

    const metadataRecord = metadata as Record<string, unknown>;
    for (const key of candidates) {
      const value = metadataRecord[key];
      if (typeof value === 'string' && value.startsWith('http')) {
        return value;
      }
    }

    return null;
  };

  const handleOnlinePayment = async (method: 'VNPAY' | 'MOMO') => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng phương thức thanh toán này');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    setIsSubmitting(true);
    setPaymentStatus('processing');

    try {
      // Đồng bộ giỏ hàng từ localStorage lên server trước
      toast.loading('Đang đồng bộ giỏ hàng...', { id: 'sync-cart' });
      
      // Đồng bộ toàn bộ giỏ hàng lên server một lần
      try {
        await cartService.updateCart({
          items: cartItems.map(item => ({
            id: item.productId,
            quantity: item.quantity || 1,
            tenSP: item.tenSP,
            selectedDungTich: item.selectedDungTich,
          })),
        });
      } catch (syncError: unknown) {
        if (import.meta.env.DEV) {
          console.warn('Failed to sync cart:', syncError);
        }
        // Nếu updateCart thất bại, thử đồng bộ từng item
        for (const item of cartItems) {
          try {
            await cartService.addToCart({
              productId: item.productId,
              quantity: item.quantity,
              selectedDungTich: item.selectedDungTich,
            });
          } catch (itemError: unknown) {
            if (import.meta.env.DEV) {
              console.warn('Failed to sync cart item:', item.productId, itemError);
            }
          }
        }
      }

      toast.dismiss('sync-cart');
      toast.loading('Đang khởi tạo thanh toán...', { id: 'create-payment' });

      const apiMethod = method === 'VNPAY' ? 'vnpay' : 'momo';
      const response = await paymentService.createPayment(apiMethod);
      const metadata = response?.metadata ?? (response as Record<string, unknown>)?.data ?? response;
      const redirectUrl = extractPaymentRedirectUrl(metadata);

      toast.dismiss('create-payment');

      if (!redirectUrl) {
        throw new Error('Không tìm thấy liên kết thanh toán. Vui lòng thử lại.');
      }

      toast.success('Đang chuyển hướng tới cổng thanh toán...');
      window.location.href = redirectUrl;
    } catch (error: unknown) {
      toast.dismiss('sync-cart');
      toast.dismiss('create-payment');
      if (import.meta.env.DEV) {
        console.error('Online payment error:', error);
      }
      const errorRecord = error as Record<string, unknown>;
      const errorMsg = (((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined) ||
        (errorRecord?.message as string | undefined);
      toast.error(errorMsg || 'Không thể khởi tạo giao dịch thanh toán');
      setPaymentStatus('fail');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lấy danh sách quận/huyện và phường/xã dựa trên tỉnh/thành phố đã chọn
  const availableDistricts = useMemo(() => {
    if (!newAddress.TinhThanh) return [];
    return getDistrictsByProvince(newAddress.TinhThanh).map(d => d.name);
  }, [newAddress.TinhThanh]);
  
  const availableWards = useMemo(() => {
    if (!newAddress.TinhThanh || !newAddress.QuanHuyen) return [];
    return getWardsByDistrict(newAddress.TinhThanh, newAddress.QuanHuyen);
  }, [newAddress.TinhThanh, newAddress.QuanHuyen]);

  // Reset quận/huyện và phường/xã khi thay đổi tỉnh/thành phố
  const handleProvinceChange = (province: string) => {
    setNewAddress({
      ...newAddress,
      TinhThanh: province,
      QuanHuyen: '',
      PhuongXa: '',
    });
  };

  // Reset phường/xã khi thay đổi quận/huyện
  const handleDistrictChange = (district: string) => {
    setNewAddress({
      ...newAddress,
      QuanHuyen: district,
      PhuongXa: '',
    });
  };

  useEffect(() => {
    setCartItems(storage.getCart());
    const onUpdate = () => setCartItems(storage.getCart());
    window.addEventListener('cart:updated', onUpdate as EventListener);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('cart:updated', onUpdate as EventListener);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) {
        setAddresses([]);
        setShowNewAddress(true);
        return;
      }
      try {
        // ✅ userService.getAddresses() trả về UserAddress[] (đã được fix)
        const list = await userService.getAddresses();
        
        const formattedList = list.map((addr: UserAddress) => ({
          _id: addr._id || addr.id,
          HoTen: addr.HoTen || '',
          SoDienThoai: addr.SoDienThoai || '',
          DiaChiChiTiet: addr.DiaChiChiTiet || '',
          PhuongXa: addr.PhuongXa || '',
          QuanHuyen: addr.QuanHuyen || '',
          TinhThanh: addr.TinhThanh || '',
          MacDinh: !!addr.MacDinh,
        }));
        
        setAddresses(formattedList);
        const def = formattedList.find((a) => a.MacDinh);
        setSelectedAddressId((def?._id as string) || (formattedList[0]?._id as string) || null);
        setShowNewAddress(formattedList.length === 0);
      } catch (e: unknown) {
        if (import.meta.env.DEV) {
          console.error('Error fetching addresses:', e);
        }
        setAddresses([]);
        setShowNewAddress(true);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, p) => {
      const unit = Number(p.gia) || 0;
      const discount = Number(p.giamGia) || 0;
      const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
      return sum + finalUnit * (p.quantity || 0);
    }, 0);
  }, [cartItems]);
  const shipping = 0;
  const voucherDiscountAmount = Math.floor(subtotal * (voucherDiscountPct / 100));
  const total = Math.max(0, subtotal - voucherDiscountAmount + shipping);

  const applyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherDiscountPct(0);
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    if (code === 'GIAM10') {
      setVoucherDiscountPct(10);
      toast.success('Áp dụng mã giảm 10% thành công');
    } else if (code === 'GIAM20') {
      setVoucherDiscountPct(20);
      toast.success('Áp dụng mã giảm 20% thành công');
    } else if (code === 'FREESHIP') {
      setVoucherDiscountPct(0);
      toast.success('Áp dụng miễn phí vận chuyển');
    } else {
      setVoucherDiscountPct(0);
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  const saveNewAddress = async () => {
    try {
      const response = await userService.createAddress(newAddress);
      toast.success('Đã lưu địa chỉ');
      
      const responseAny = response as unknown as Record<string, unknown>;
      const newAddr: UserAddress = {
        _id: String(responseAny?._id || (responseAny?.data as Record<string, unknown>)?.id || responseAny?.id || ''),
        HoTen: newAddress.HoTen,
        SoDienThoai: newAddress.SoDienThoai,
        DiaChiChiTiet: newAddress.DiaChiChiTiet,
        PhuongXa: newAddress.PhuongXa,
        QuanHuyen: newAddress.QuanHuyen,
        TinhThanh: newAddress.TinhThanh,
        MacDinh: Boolean(newAddress.MacDinh),
      };

      const normalizedExisting = newAddr.MacDinh
        ? addresses.map((addr) => ({ ...addr, MacDinh: false }))
        : addresses;
      const updatedAddresses = [...normalizedExisting, newAddr];
      setAddresses(updatedAddresses);
      setShowNewAddress(false);
      setSelectedAddressId(newAddr._id || null);
      setNewAddress({ HoTen: '', SoDienThoai: '', DiaChiChiTiet: '', PhuongXa: '', QuanHuyen: '', TinhThanh: '', MacDinh: false });
    } catch (e: unknown) {
      const errorMsg = (e as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể lưu địa chỉ');
    }
  };
  const checkOut = async () => {
    try {
      if (cartItems.length === 0) {
        toast.error('Giỏ hàng trống');
        return;
      }
      
      let DiaChiPayload: string | UserAddress | null = null;
      if (isAuthenticated) {
        if (!selectedAddressId) {
          toast.error('Vui lòng chọn địa chỉ giao hàng');
          return;
        }
        DiaChiPayload = selectedAddressId;
      } else {
        if (!newAddress.HoTen || !newAddress.SoDienThoai || !newAddress.DiaChiChiTiet) {
          toast.error('Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ chi tiết');
          return;
        }
        DiaChiPayload = newAddress;
      }

      if (selectedPaymentMethod === 'VNPAY' || selectedPaymentMethod === 'MOMO') {
        await handleOnlinePayment(selectedPaymentMethod);
        return;
      }

      setIsSubmitting(true);
      setPaymentStatus('processing');

      // Format cartItems thành format backend yêu cầu
      const formattedSanPham = cartItems.map(item => ({
        MaSanPham: item.productId,
        SoLuong: item.quantity,
        Gia: item.gia,
        TenSanPham: item.tenSP,
        HinhAnhChinh: item.hinhAnh,
        selectedDungTich: item.selectedDungTich,
      }));

      let checkoutResult: CheckoutResponse | null = null;
      try {
        const checkoutPayload: CheckoutPayload = typeof DiaChiPayload === 'string' 
          ? {
              DiaChi: DiaChiPayload,
              SanPham: formattedSanPham,
              TongTien: total,
              PhuongThucThanhToan: selectedPaymentMethod,
              GhiChu: selectedNote,
              Voucher: voucherCode || undefined,
            }
          : DiaChiPayload
            ? {
                ThongTinNhanHang: {
                  HoTen: DiaChiPayload.HoTen,
                  Email: user?.email || (user as unknown as Record<string, unknown>)?.Email as string || '',
                  SoDienThoai: DiaChiPayload.SoDienThoai,
                  DiaChiChiTiet: DiaChiPayload.DiaChiChiTiet,
                  PhuongXa: DiaChiPayload.PhuongXa || '',
                  QuanHuyen: DiaChiPayload.QuanHuyen || '',
                  TinhThanh: DiaChiPayload.TinhThanh || '',
                },
                SanPham: formattedSanPham,
                TongTien: total,
                PhuongThucThanhToan: selectedPaymentMethod,
                GhiChu: selectedNote,
                Voucher: voucherCode || undefined,
              }
            : {
                SanPham: formattedSanPham,
                TongTien: total,
                PhuongThucThanhToan: selectedPaymentMethod,
                GhiChu: selectedNote,
                Voucher: voucherCode || undefined,
              };
        const response = await cartService.checkout(checkoutPayload);
        
        checkoutResult = response as unknown as CheckoutResponse;
      } catch (checkoutError: unknown) {
        const errorRecord = checkoutError as Record<string, unknown>;
        const errorMsg = (errorRecord?.message as string | undefined) || 
          ((errorRecord?.data as Record<string, unknown>)?.message as string | undefined) || 
          'Không thể tạo đơn hàng. Vui lòng thử lại.';
        toast.error(errorMsg);
        setPaymentStatus('fail');
        setIsSubmitting(false);
        return;
      }

      // Validate checkout result
      if (!checkoutResult) {
        if (import.meta.env.DEV) {
          console.error('Checkout result is null or undefined');
        }
        toast.error('Không nhận được phản hồi từ server. Vui lòng thử lại.');
        setPaymentStatus('fail');
        setIsSubmitting(false);
        return;
      }

      let orderId: string | null = null;
      
      if (checkoutResult?.donHang?._id) {
        const id = checkoutResult.donHang._id;
        orderId = typeof id === 'string' ? id : String(id);
      } else if (checkoutResult?.donHang && 'id' in checkoutResult.donHang && checkoutResult.donHang.id) {
        const id = checkoutResult.donHang.id;
        orderId = typeof id === 'string' ? id : String(id);
      } else if (checkoutResult?.data?.donHang?._id) {
        const id = checkoutResult.data.donHang._id;
        orderId = typeof id === 'string' ? id : String(id);
      } else if (checkoutResult?.data?.donHang && 'id' in checkoutResult.data.donHang && checkoutResult.data.donHang.id) {
        const id = checkoutResult.data.donHang.id;
        orderId = typeof id === 'string' ? id : String(id);
      } else if (checkoutResult?._id) {
        const id = checkoutResult._id;
        orderId = typeof id === 'string' ? id : String(id);
      } else if (checkoutResult?.donHang) {
        const donHang = checkoutResult.donHang as Record<string, unknown>;
        if (donHang._id) {
          orderId = typeof donHang._id === 'string' ? donHang._id : String(donHang._id);
        } else if (donHang.id) {
          orderId = typeof donHang.id === 'string' ? donHang.id : String(donHang.id);
        }
      }

      if (!orderId || orderId === 'null' || orderId === 'undefined') {
        if (import.meta.env.DEV) {
          console.error('Failed to extract order ID. Full result:', checkoutResult);
        }
        toast.error('Không thể lấy ID đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
        setPaymentStatus('fail');
        setIsSubmitting(false);
        return;
      }

      if (selectedPaymentMethod === 'COD') {
        toast.success('Đặt hàng thành công');
        storage.setCart([]);
        window.dispatchEvent(new CustomEvent('cart:updated'));
        setPaymentStatus('success');
        return;
      }
      if (selectedPaymentMethod === 'BANK' || selectedPaymentMethod === 'CARD') {
        toast.success('Đặt hàng thành công. Vui lòng thanh toán theo hướng dẫn.');
        storage.setCart([]);
        window.dispatchEvent(new CustomEvent('cart:updated'));
        setPaymentStatus('success');
      }
    } catch (e: unknown) {
      if (import.meta.env.DEV) {
        console.error('Checkout error:', e);
      }
      const errorMsg = (e as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể đặt hàng');
      setPaymentStatus('fail');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (paymentStatus === 'success') {
    return (
      <MainLayout>
        <PaymentSuccess />
      </MainLayout>
    );
  }
  if (paymentStatus === 'fail') {
    return (
      <MainLayout>
        <PaymentFail />
      </MainLayout>
    );
  }
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Thanh toán</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Địa chỉ giao hàng
                  </h2>
                </div>
                <div className="space-y-4">
                  {addresses.length > 0 && !showNewAddress && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          Chọn địa chỉ giao hàng
                        </Label>
                        <Select
                          value={selectedAddressId || undefined}
                          onValueChange={(value) => setSelectedAddressId(value || null)}
                        >
                          <SelectTrigger className="w-full h-12 bg-background border-input rounded-xl hover:border-primary/50 transition-colors text-left">
                            {selectedAddress ? (
                              <div
                                data-slot="select-value"
                                className="flex items-center gap-2 flex-wrap text-sm"
                              >
                                <span className="font-semibold truncate max-w-[50%]">
                                  {selectedAddress.HoTen}
                                </span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">
                                  {selectedAddress.SoDienThoai}
                                </span>
                                {selectedAddress.MacDinh && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                            ) : (
                              <SelectValue placeholder="Chọn địa chỉ giao hàng" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                      {addresses.map((addr) => (
                              <SelectItem key={addr._id} value={addr._id || ''}>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{addr.HoTen}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">{addr.SoDienThoai}</span>
                            {addr.MacDinh && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                                        Mặc định
                                      </span>
                            )}
                          </div>
                                  <span className="text-sm text-foreground">{addr.DiaChiChiTiet}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {[addr.PhuongXa, addr.QuanHuyen, addr.TinhThanh].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedAddress && (
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground">
                                  {selectedAddress.HoTen}
                                </p>
                                <span className="text-muted-foreground">·</span>
                                <p className="text-muted-foreground">{selectedAddress.SoDienThoai}</p>
                                {selectedAddress.MacDinh && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-foreground">{selectedAddress.DiaChiChiTiet}</p>
                              <p className="text-sm text-muted-foreground">
                                {[selectedAddress.PhuongXa, selectedAddress.QuanHuyen, selectedAddress.TinhThanh].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <Button variant="outline" className="border-border w-full" onClick={() => setShowNewAddress(true)}>
                        Thêm địa chỉ mới
                      </Button>
                    </div>
                  )}

                  {(addresses.length === 0 || showNewAddress) && (
                    <div className="space-y-4">
                      {!isAuthenticated && (
                        <div className="bg-muted/50 border border-border rounded-xl p-4 mb-4">
                          <p className="text-sm text-muted-foreground">
                            Bạn đang đặt hàng với tư cách khách. Vui lòng điền đầy đủ thông tin để chúng tôi có thể giao hàng cho bạn.
                          </p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Họ và tên <span className="text-destructive">*</span></Label>
                          <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.HoTen} onChange={(e) => setNewAddress({ ...newAddress, HoTen: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Số điện thoại <span className="text-destructive">*</span></Label>
                          <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.SoDienThoai} onChange={(e) => setNewAddress({ ...newAddress, SoDienThoai: e.target.value })} required />
                        </div>
                      </div>
                      <div>
                        <Label>Địa chỉ chi tiết <span className="text-destructive">*</span></Label>
                        <Input className="bg-background border-input h-12 rounded-xl px-4" value={newAddress.DiaChiChiTiet} onChange={(e) => setNewAddress({ ...newAddress, DiaChiChiTiet: e.target.value })} required />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Tỉnh/Thành phố <span className="text-destructive">*</span></Label>
                          <Select
                            value={newAddress.TinhThanh}
                            onValueChange={handleProvinceChange}
                          >
                            <SelectTrigger className="w-full h-12 bg-background border-input rounded-xl">
                              <SelectValue placeholder="Chọn tỉnh/thành phố" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAllProvinces().map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quận/Huyện <span className="text-destructive">*</span></Label>
                          <Select
                            value={newAddress.QuanHuyen || undefined}
                            onValueChange={handleDistrictChange}
                            disabled={!newAddress.TinhThanh}
                          >
                            <SelectTrigger className="w-full h-12 bg-background border-input rounded-xl">
                              <SelectValue placeholder={newAddress.TinhThanh ? (availableDistricts.length > 0 ? "Chọn quận/huyện" : "Chưa có dữ liệu") : "Chọn tỉnh/thành phố trước"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDistricts.length > 0 ? (
                                availableDistricts.map((district) => (
                                  <SelectItem key={district} value={district}>
                                    {district}
                                  </SelectItem>
                                ))
                              ) : newAddress.TinhThanh ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Chưa có dữ liệu cho tỉnh này
                                </div>
                              ) : (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Vui lòng chọn tỉnh/thành phố trước
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          {availableDistricts.length === 0 && newAddress.TinhThanh && (
                            <Input 
                              className="bg-background border-input h-12 rounded-xl px-4 mt-2" 
                              value={newAddress.QuanHuyen} 
                              onChange={(e) => setNewAddress({ ...newAddress, QuanHuyen: e.target.value })} 
                              placeholder="Nhập quận/huyện (nếu chưa có trong danh sách)"
                              required 
                            />
                          )}
                        </div>
                        <div>
                          <Label>Phường/Xã</Label>
                          <Select
                            value={newAddress.PhuongXa || undefined}
                            onValueChange={(value) => setNewAddress({ ...newAddress, PhuongXa: value })}
                            disabled={!newAddress.QuanHuyen}
                          >
                            <SelectTrigger className="w-full h-12 bg-background border-input rounded-xl">
                              <SelectValue placeholder={newAddress.QuanHuyen ? (availableWards.length > 0 ? "Chọn phường/xã" : "Chưa có dữ liệu") : "Chọn quận/huyện trước"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableWards.length > 0 ? (
                                availableWards.map((ward) => (
                                  <SelectItem key={ward} value={ward}>
                                    {ward}
                                  </SelectItem>
                                ))
                              ) : newAddress.QuanHuyen ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Chưa có dữ liệu cho quận/huyện này
                                </div>
                              ) : (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Vui lòng chọn quận/huyện trước
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          {availableWards.length === 0 && newAddress.QuanHuyen && (
                            <Input 
                              className="bg-background border-input h-12 rounded-xl px-4 mt-2" 
                              value={newAddress.PhuongXa} 
                              onChange={(e) => setNewAddress({ ...newAddress, PhuongXa: e.target.value })} 
                              placeholder="Nhập phường/xã (nếu chưa có trong danh sách)"
                            />
                          )}
                        </div>
                      </div>
                      {isAuthenticated && (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input type="checkbox" checked={newAddress.MacDinh} onChange={(e) => setNewAddress({ ...newAddress, MacDinh: e.target.checked })} />
                          Đặt làm địa chỉ mặc định
                        </label>
                        <div className="space-x-2">
                          {addresses.length > 0 && (
                            <Button variant="outline" className="border-border" onClick={() => setShowNewAddress(false)}>Hủy</Button>
                          )}
                          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={saveNewAddress}>Lưu địa chỉ</Button>
                        </div>
                      </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Phương thức thanh toán
                  </h2>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-primary rounded-xl cursor-pointer bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'COD'}
                      onChange={() => setSelectedPaymentMethod('COD')}
                    />
                    <span className="font-semibold text-foreground">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'BANK'}
                      onChange={() => setSelectedPaymentMethod('BANK')}
                    />
                    <span className="font-semibold text-foreground">
                      Chuyển khoản ngân hàng
                    </span>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'CARD'}
                      onChange={() => setSelectedPaymentMethod('CARD')}
                    />
                    <span className="font-semibold text-foreground">
                      Thẻ tín dụng/Ghi nợ (Khác)
                    </span>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'VNPAY'}
                      onChange={() => setSelectedPaymentMethod('VNPAY')}
                      disabled={!isAuthenticated}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">VNPay (ATM/QR)</span>
                      {!isAuthenticated && (
                        <span className="text-xs text-muted-foreground">
                          Yêu cầu đăng nhập
                        </span>
                      )}
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-border rounded-xl cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="payment"
                      className="mr-3"
                      checked={selectedPaymentMethod === 'MOMO'}
                      onChange={() => setSelectedPaymentMethod('MOMO')}
                      disabled={!isAuthenticated}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">Ví MoMo</span>
                      {!isAuthenticated && (
                        <span className="text-xs text-muted-foreground">
                          Yêu cầu đăng nhập
                        </span>
                      )}
                    </div>
                  </label>
                  <div>
                    <Label>Ghi chú</Label>
                    <Input
                      placeholder="Ghi chú cho đơn hàng (tuỳ chọn)"
                      className="bg-background border-input h-12 rounded-xl px-4"
                      value={selectedNote}
                      onChange={(e) => setSelectedNote(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Đơn hàng của bạn
                </h2>
                {/* Voucher */}
                <div className="mb-6">
                  <Label>Mã giảm giá</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nhập mã (vd: GIAM10, GIAM20, FREESHIP)"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="bg-background border-input h-12 rounded-xl px-4"
                    />
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={applyVoucher}>Áp dụng</Button>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => {
                    const unit = Number(item.gia) || 0;
                    const discount = Number(item.giamGia) || 0;
                    const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {item.tenSP} x{item.quantity}
                        </span>
                        <span className="font-semibold text-foreground">
                          {(finalUnit * (item.quantity || 0)).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-foreground mb-2">
                      <span>Tạm tính</span>
                      <span className="font-semibold">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {voucherDiscountPct > 0 && (
                      <div className="flex justify-between text-foreground mb-2">
                        <span>Giảm giá ({voucherDiscountPct}%)</span>
                        <span className="font-semibold text-green-600">- {voucherDiscountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between text-foreground mb-4">
                      <span>Phí vận chuyển</span>
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Tổng cộng</span>
                      <span className="text-primary">
                        {total.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg"
                  onClick={checkOut}
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? 'Đang xử lý...'
                    : 'Đặt hàng'}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Bằng việc đặt hàng, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

