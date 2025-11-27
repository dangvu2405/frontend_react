import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage, type CartItem } from '@/utils/storage';
import { getCloudinaryProductImageUrl } from '@/utils/imageUtils';

const formatCurrency = (value: number) =>
  value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export const CartView = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>(() => storage.getCart());

  useEffect(() => {
    const handleUpdate = () => setItems(storage.getCart());
    window.addEventListener('cart:updated', handleUpdate as EventListener);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('cart:updated', handleUpdate as EventListener);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const basePrice = Number(item.gia) || 0;
      const discount = Number(item.giamGia) || 0;
      const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
      return sum + finalPrice * (item.quantity || 0);
    }, 0);
  }, [items]);

  const updateQuantity = (productId: string, quantity: number) => {
    const nextQuantity = Math.max(1, quantity);
    storage.updateCartItemQuantity(productId, nextQuantity);
    const updated = storage.getCart();
    setItems(updated);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const removeItem = (productId: string) => {
    storage.removeCartItem(productId);
    const updated = storage.getCart();
    setItems(updated);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  const handleVolumeChange = (cartItemId: string, value: string) => {
    const target = items.find((item) => item.id === cartItemId);
    if (!target || !target.volumeOptions) return;
    const option = target.volumeOptions.find((opt) => String(opt?.value) === value);
    if (!option) return;

    storage.updateCartItemVolume(cartItemId, option);
    const updated = storage.getCart();
    setItems(updated);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã cập nhật dung tích');
  };

  const clearCart = () => {
    storage.clearCart();
    setItems([]);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const proceedToCheckout = () => {
    if (items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }
    navigate('/checkout');
  };

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary">Giỏ hàng</p>
            <h1 className="text-3xl font-bold text-foreground">Sản phẩm của bạn</h1>
            <p className="text-muted-foreground">
              Bạn có {items.reduce((sum, item) => sum + (item.quantity || 0), 0)} sản phẩm trong giỏ hàng
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/products')}>
            Tiếp tục mua hàng
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Danh sách sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-muted-foreground">
                  <p>Giỏ hàng trống. Hãy khám phá thêm sản phẩm!</p>
                  <Button asChild>
                    <Link to="/products">Khám phá sản phẩm</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => {
                    const discount = Number(item.giamGia) || 0;
                    const basePrice = Number(item.gia) || 0;
                    const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
                    const lineTotal = finalPrice * (item.quantity || 0);

                    return (
                      <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border/60 p-4 md:flex-row">
                        <div className="flex items-start gap-4">
                          <img
                            src={getCloudinaryProductImageUrl(item.hinhAnh || '') || 'https://placehold.co/200x200?text=No+Image'}
                            alt={item.tenSP}
                            className="h-28 w-28 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="text-lg font-semibold">{item.tenSP}</h3>
                            <p className="text-sm text-muted-foreground">{item.loaiSP}</p>
                            <div className="mt-2 flex items-center gap-3 text-sm">
                              <span className="text-primary font-semibold">
                                {formatCurrency(finalPrice)}
                              </span>
                              {discount > 0 && (
                                <span className="text-muted-foreground line-through">
                                  {formatCurrency(basePrice)}
                                </span>
                              )}
                            </div>
                            {item.volumeOptions && item.volumeOptions.length > 0 ? (
                              <div className="mt-3 w-48">
                                <p className="text-xs text-muted-foreground mb-1">Dung tích</p>
                                <Select
                                  value={String(item.selectedDungTich?.value ?? item.volumeOptions[0]?.value ?? '')}
                                  onValueChange={(value) => handleVolumeChange(item.id, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn dung tích" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {item.volumeOptions.map((option) => (
                                      <SelectItem
                                        key={`${item.id}-${option?.value ?? 'default'}`}
                                        value={String(option?.value ?? '')}
                                      >
                                        {option?.label || `${option?.value} ml`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              item.selectedDungTich && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Dung tích:{' '}
                                  <span className="font-medium text-foreground">
                                    {item.selectedDungTich.label || `${item.selectedDungTich.value} ml`}
                                  </span>
                                </p>
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col items-start gap-4 md:flex-row md:items-center md:justify-end">
                          <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              min={1}
                              onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                              className="h-8 w-16 text-center"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Tổng</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(lineTotal)}</p>
                          </div>
                          <Button variant="ghost" className="text-destructive" onClick={() => removeItem(item.id)}>
                            Xóa
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            {items.length > 0 && (
              <CardFooter className="justify-between border-t border-border/70 pt-4">
                <Button variant="ghost" onClick={clearCart}>
                  Xóa toàn bộ
                </Button>
                <span className="text-sm text-muted-foreground">
                  Tổng cộng {items.length} sản phẩm
                </span>
              </CardFooter>
            )}
          </Card>

          <Card className="h-fit border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-4 text-lg font-semibold">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatCurrency(subtotal)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={proceedToCheckout}>
                Tiến hành thanh toán
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
};

export default CartView;

