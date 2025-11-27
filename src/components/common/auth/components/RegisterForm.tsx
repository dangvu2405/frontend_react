import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    hoten: '',
    username: '',
    email: '',
    sdt: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        hoten: formData.hoten.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        sdt: formData.sdt.trim() || undefined,
        password: formData.password,
      });
      toast.success('Đăng ký thành công');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.message || 'Đăng ký thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-2xl border-border/60 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Tạo tài khoản mới</CardTitle>
            <CardDescription>
              Miễn phí và chỉ mất vài phút để hoàn tất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hoten">Họ tên</Label>
                <Input
                  id="hoten"
                  value={formData.hoten}
                  onChange={(event) => updateField('hoten', event.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại (tuỳ chọn)</Label>
                <Input
                  id="phone"
                  value={formData.sdt}
                  onChange={(event) => updateField('sdt', event.target.value)}
                  placeholder="0123456789"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Khi đăng ký, bạn đồng ý với{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </Link>
                  .
                </p>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default RegisterForm;

