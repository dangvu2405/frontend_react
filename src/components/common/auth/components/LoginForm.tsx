import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants';

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectPath =
    (location.state as { from?: Location })?.from?.pathname ?? '/';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    try {
      setSubmitting(true);
      await login(username.trim(), password.trim());
      toast.success('Đăng nhập thành công');
      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Construct the Google OAuth URL
    // Backend auth routes are mounted at /auth (not /api/auth)
    const apiUrl = API_BASE_URL || '';
    const googleAuthUrl = apiUrl 
      ? `${apiUrl}${API_ENDPOINTS.GOOGLE_AUTH}`
      : `${window.location.origin}${API_ENDPOINTS.GOOGLE_AUTH}`;
    
    // Redirect to Google OAuth
    window.location.href = googleAuthUrl;
  };

  if (isAuthenticated) {
    navigate(redirectPath, { replace: true });
    return null;
  }

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-lg border-border/60 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>
              Quản lý tài khoản và đơn hàng của bạn ở một nơi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  value={username}
                  autoComplete="username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <Link
                  to="/forgot-password"
                  className="text-primary transition-colors hover:text-primary/80"
                >
                  Quên mật khẩu?
                </Link>
                <Link
                  to="/signup"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Chưa có tài khoản? Đăng ký
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full mt-6"
                onClick={handleGoogleLogin}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Đăng nhập bằng Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default LoginForm;

