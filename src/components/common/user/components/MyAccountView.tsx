import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserAddress } from '@/types/models';
import { userService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';

const emptyAddress: UserAddress = {
  HoTen: '',
  SoDienThoai: '',
  DiaChiChiTiet: '',
  QuanHuyen: '',
  TinhThanh: '',
  PhuongXa: '',
  MacDinh: false,
};

export const MyAccountView = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [newAddress, setNewAddress] = useState<UserAddress>(emptyAddress);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return;
      try {
        setLoadingAddresses(true);
        
        // Debug: Log API call
        if (import.meta.env.DEV) {
          console.log('👤 [MyAccount Page] Fetching user addresses...');
        }
        
        const result = await userService.getAddresses();
        
        // Debug: Log API response
        if (import.meta.env.DEV) {
          console.log('👤 [MyAccount Page] Addresses received:', {
            count: result.length,
            addresses: result,
          });
        }
        
        setAddresses(result);
      } catch (error: unknown) {
        if (import.meta.env.DEV) {
          const errorRecord = error as Record<string, unknown>;
          console.error('👤 [MyAccount Page] Error fetching addresses:', {
            error,
            message: errorRecord?.message,
            response: (errorRecord?.response as Record<string, unknown>)?.data,
          });
        }
        const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
        toast.error(errorMsg || 'Không thể tải địa chỉ');
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  const updateAddressField = (field: keyof UserAddress, value: string | boolean) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newAddress.HoTen || !newAddress.SoDienThoai || !newAddress.DiaChiChiTiet) {
      toast.error('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }
    try {
      setSavingAddress(true);
      
      // Debug: Log API call
      if (import.meta.env.DEV) {
        console.log('👤 [MyAccount Page] Creating new address...', { address: newAddress });
      }
      
      const created = await userService.createAddress(newAddress);
      
      // Debug: Log API response
      if (import.meta.env.DEV) {
        console.log('👤 [MyAccount Page] Address created:', { address: created });
      }
      
      setAddresses((prev) => [...prev, created]);
      setNewAddress(emptyAddress);
      toast.success('Đã thêm địa chỉ mới');
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        const errorRecord = error as Record<string, unknown>;
        console.error('👤 [MyAccount Page] Error creating address:', {
          error,
          message: errorRecord?.message,
          response: (errorRecord?.response as Record<string, unknown>)?.data,
        });
      }
      const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể lưu địa chỉ');
    } finally {
      setSavingAddress(false);
    }
  };

  const setDefaultAddress = async (addressId?: string) => {
    if (!addressId) return;
    try {
      await userService.setDefaultAddress(addressId);
      setAddresses((prev) =>
        prev.map((address) => (address._id === addressId ? { ...address, MacDinh: true } : { ...address, MacDinh: false })),
      );
      toast.success('Đã đặt địa chỉ mặc định');
    } catch (error: unknown) {
      const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể cập nhật địa chỉ');
    }
  };

  const removeAddress = async (addressId?: string) => {
    if (!addressId) return;
    try {
      await userService.deleteAddress(addressId);
      setAddresses((prev) => prev.filter((address) => address._id !== addressId));
      toast.success('Đã xóa địa chỉ');
    } catch (error: unknown) {
      const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Không thể xóa địa chỉ');
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
          <Card className="w-full max-w-md border-border/70 shadow-md">
            <CardHeader>
              <CardTitle>Vui lòng đăng nhập</CardTitle>
              <CardDescription>Đăng nhập để quản lý tài khoản và đơn hàng của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/signup')}>
                Đăng ký tài khoản mới
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wide text-primary">Tài khoản</p>
          <h1 className="text-3xl font-bold text-foreground">Xin chào, {user?.fullName || user?.username}</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cá nhân, địa chỉ giao hàng và các lựa chọn bảo mật.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Thông tin được sử dụng khi giao hàng và liên lạc.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Họ tên</Label>
                  <p className="mt-1 font-medium">{user?.fullName || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Email</Label>
                  <p className="mt-1 font-medium">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Số điện thoại</Label>
                  <p className="mt-1 font-medium">{user?.phone || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Vai trò</Label>
                  <p className="mt-1 font-medium">{user?.roleName || 'Khách hàng'}</p>
                </div>
              </CardContent>
              <CardContent className="flex flex-wrap gap-3 border-t border-border/70 pt-4">
                <Button variant="outline" onClick={() => navigate('/orders')} disabled>
                  Xem đơn hàng
                </Button>
                <Button variant="outline" onClick={() => logout()}>
                  Đăng xuất
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Địa chỉ giao hàng</CardTitle>
                <CardDescription>Quản lý địa chỉ để thanh toán nhanh chóng hơn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingAddresses ? (
                  <p className="text-sm text-muted-foreground">Đang tải địa chỉ...</p>
                ) : addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có địa chỉ nào.</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className="rounded-lg border border-border/60 p-4 text-sm leading-relaxed"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{address.HoTen}</div>
                          {address.MacDinh && (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-muted-foreground">{address.SoDienThoai}</div>
                        <div className="mt-1">
                          {address.DiaChiChiTiet}, {address.PhuongXa}, {address.QuanHuyen}, {address.TinhThanh}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!address.MacDinh && (
                            <Button size="sm" variant="outline" onClick={() => setDefaultAddress(address._id as string)}>
                              Đặt làm mặc định
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeAddress(address._id as string)}>
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardContent className="border-t border-border/70 pt-6">
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveAddress}>
                  <div className="space-y-2">
                    <Label>Họ tên</Label>
                    <Input
                      value={newAddress.HoTen}
                      onChange={(event) => updateAddressField('HoTen', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={newAddress.SoDienThoai}
                      onChange={(event) => updateAddressField('SoDienThoai', event.target.value)}
                      required
                      inputMode="tel"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Địa chỉ chi tiết</Label>
                    <Input
                      value={newAddress.DiaChiChiTiet}
                      onChange={(event) => updateAddressField('DiaChiChiTiet', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phường / Xã</Label>
                    <Input
                      value={newAddress.PhuongXa}
                      onChange={(event) => updateAddressField('PhuongXa', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quận / Huyện</Label>
                    <Input
                      value={newAddress.QuanHuyen}
                      onChange={(event) => updateAddressField('QuanHuyen', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tỉnh / Thành phố</Label>
                    <Input
                      value={newAddress.TinhThanh}
                      onChange={(event) => updateAddressField('TinhThanh', event.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="defaultAddress"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={newAddress.MacDinh}
                      onChange={(event) => updateAddressField('MacDinh', event.target.checked)}
                    />
                    <Label htmlFor="defaultAddress" className="text-sm text-muted-foreground">
                      Đặt làm địa chỉ mặc định
                    </Label>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full" disabled={savingAddress}>
                      {savingAddress ? 'Đang lưu...' : 'Thêm địa chỉ mới'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Bảo mật</CardTitle>
                <CardDescription>Thao tác nhanh liên quan tới tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" disabled>
                  Đổi mật khẩu (sắp ra mắt)
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Quản lý liên kết mạng xã hội
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => logout()}>
                  Đăng xuất
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default MyAccountView;

