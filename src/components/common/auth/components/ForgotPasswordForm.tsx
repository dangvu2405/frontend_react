import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import authService from '@/services/authService';

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    try {
      setSubmitting(true);
      await authService.forgotPassword(email.trim());
      toast.success('Vui lòng kiểm tra email để đặt lại mật khẩu');
      setSent(true);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Không thể gửi yêu cầu';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-lg border-border/60 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
            <CardDescription>
              Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Email khôi phục đã được gửi tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn.
                </p>
                <Button asChild variant="outline">
                  <Link to="/login">Quay lại đăng nhập</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi hướng dẫn khôi phục'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Nhớ mật khẩu rồi?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ForgotPasswordForm;

