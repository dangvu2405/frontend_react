import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE_URL } from "@/constants";
import { toast } from "sonner";
import { storage } from "@/utils/storage";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const turnstileContainerRef = React.useRef<HTMLDivElement>(null);
  const scriptLoadedRef = React.useRef(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load Cloudflare Turnstile script (chỉ load một lần)
  useEffect(() => {
    // Kiểm tra xem script đã được load chưa
    if (window.turnstile) {
      setTurnstileLoaded(true);
      return;
    }

    // Kiểm tra xem script đã được thêm vào DOM chưa
    const existingScript = document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
    if (existingScript) {
      // Script đã tồn tại, đợi nó load
      existingScript.addEventListener('load', () => {
        setTurnstileLoaded(true);
      });
      return;
    }

    // Chỉ load script nếu chưa được load
    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.id = 'cloudflare-turnstile-script';
      
      script.onload = () => {
        setTurnstileLoaded(true);
      };
      
      script.onerror = () => {
        scriptLoadedRef.current = false;
        toast.error('Không thể tải Cloudflare Turnstile. Vui lòng thử lại.');
      };
      
      document.body.appendChild(script);
    }
  }, []);

  // Render Turnstile widget khi cần
  useEffect(() => {
    if (requiresCaptcha && turnstileLoaded && turnstileContainerRef.current && !turnstileWidgetId && window.turnstile) {
      const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '';
      if (siteKey) {
        try {
          const widgetId = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            'error-callback': () => {
              setTurnstileToken(null);
              toast.error('Lỗi xác minh bảo mật. Vui lòng thử lại.');
            },
            'expired-callback': () => {
              setTurnstileToken(null);
              toast.warning('Phiên xác minh đã hết hạn. Vui lòng thử lại.');
            },
          });
          setTurnstileWidgetId(widgetId);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error rendering Turnstile:', error);
          }
        }
      }
    }

    return () => {
      if (turnstileWidgetId && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId);
          setTurnstileWidgetId(null);
        } catch {
          // Ignore errors
        }
      }
    };
  }, [requiresCaptcha, turnstileLoaded, turnstileWidgetId]);

  // Xử lý lỗi OAuth từ URL parameters
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      switch (error) {
        case 'google_not_configured':
          errorMessage = 'Google OAuth chưa được cấu hình. Vui lòng liên hệ quản trị viên.';
          break;
        case 'google_invalid_client':
          errorMessage = 'Lỗi cấu hình Google OAuth: Client ID hoặc Client Secret không hợp lệ. Vui lòng kiểm tra lại cấu hình.';
          break;
        case 'google_auth_failed':
          errorMessage = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
          break;
        case 'oauth_failed':
          errorMessage = 'Đăng nhập bằng OAuth thất bại. Vui lòng thử lại.';
          break;
        case 'oauth_error':
          errorMessage = 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.';
          break;
        default:
          errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      }
      
      toast.error(errorMessage);
      
      // Xóa error parameter khỏi URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      navigate(`/login?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.username, formData.password, turnstileToken || undefined);
      
      // Reset captcha state on success
      setRequiresCaptcha(false);
      setTurnstileToken(null);
      if (turnstileWidgetId && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch {
          // Ignore
        }
        setTurnstileWidgetId(null);
      }
      
      // ✅ Kiểm tra role và redirect tương ứng
      // Đợi một chút để AuthContext cập nhật user info sau khi login
      setTimeout(() => {
        // Lấy user từ storage (đã được cập nhật bởi AuthContext sau login)
        const storedUser = storage.getUser();
        const roleName = storedUser?.roleName?.toLowerCase() || storedUser?.MaVaiTro?.TenVaiTro?.toLowerCase() || '';
        const isAdminUser = roleName === 'admin' || 
                           roleName === 'quản trị viên' || 
                           roleName === 'administrator';
        
        if (isAdminUser) {
          navigate("/admin");
        } else {
          // Lấy redirect URL từ query params nếu có, hoặc về trang chủ
          const redirectTo = searchParams.get('redirect') || '/';
          navigate(redirectTo);
        }
      }, 200);
    } catch (error: unknown) {
      const errorRecord = error as Record<string, unknown>;
      const errorData = ((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>) || (errorRecord?.data as Record<string, unknown>) || {};
      const message = (errorData?.message as string | undefined) || "Đăng nhập thất bại";
      const needsCaptcha = Boolean(errorData?.requiresCaptcha || false);
      const failedAttempts = Number(errorData?.failedAttempts || 0);

      if (needsCaptcha && !requiresCaptcha) {
        setRequiresCaptcha(true);
        setTurnstileToken(null);
        toast.warning("Vui lòng hoàn thành xác minh bảo mật để tiếp tục");
      } else {
        toast.error(typeof message === 'string' ? message : 'Đăng nhập thất bại');
        if (failedAttempts > 0 && failedAttempts < 5) {
          toast.info(`Còn ${5 - failedAttempts} lần thử trước khi tài khoản bị khóa`);
        }
        // Reset turnstile nếu có lỗi
        if (turnstileWidgetId && window.turnstile) {
          try {
            window.turnstile.reset(turnstileWidgetId);
            setTurnstileToken(null);
          } catch {
            // Ignore
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className={cn("w-full max-w-xl", className)} {...props}>
        <Card className="overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <form className="p-8 md:p-12" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col gap-2 mb-8">
                  <h1 className="text-4xl font-bold text-foreground">
                    Chào mừng trở lại
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Đăng nhập để tiếp tục mua sắm
                  </p>
                </div>

                {/* Login Fields Container */}
                <div className="bg-muted/30 border-2 border-border rounded-2xl p-6 space-y-5 mb-6">
                  <Field>
                    <FieldLabel htmlFor="username" className="text-base font-semibold">
                      Tên đăng nhập
                    </FieldLabel>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Nhập tên đăng nhập"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      className="bg-background border-input h-14 text-base px-4"
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center mb-2">
                      <FieldLabel htmlFor="password" className="text-base font-semibold">
                        Mật khẩu
                      </FieldLabel>
                      <a
                        href="/forgot-password"
                        className="ml-auto text-sm text-primary underline-offset-2 hover:underline font-medium"
                      >
                        Quên mật khẩu?
                      </a>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      className="bg-background border-input h-14 text-base px-4"
                    />
                  </Field>

                  {/* Cloudflare Turnstile */}
                  {requiresCaptcha && (
                    <Field>
                      <FieldLabel className="text-base font-semibold mb-2">
                        Xác minh bảo mật
                      </FieldLabel>
                      <div ref={turnstileContainerRef} className="flex justify-center"></div>
                      <FieldDescription className="text-xs mt-2">
                        Vui lòng hoàn thành xác minh bảo mật để tiếp tục đăng nhập
                      </FieldDescription>
                    </Field>
                  )}
                </div>

                <Field>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                </Field>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Hoặc đăng nhập với
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-14 text-base font-semibold border-2 hover:bg-muted"
                    onClick={() => {
                      window.location.href = `${API_BASE_URL}/auth/google`;
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                </div>

                <FieldDescription className="text-center text-base">
                  Chưa có tài khoản?{" "}
                  <a href="/register" className="text-primary font-semibold hover:underline">
                    Đăng ký ngay
                  </a>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Bằng việc đăng nhập, bạn đồng ý với{" "}
          <a href="/terms" className="text-primary font-medium hover:underline underline-offset-2">
            Điều khoản sử dụng
          </a>{" "}
          và{" "}
          <a href="/privacy" className="text-primary font-medium hover:underline underline-offset-2">
            Chính sách bảo mật
          </a>
        </p>
      </div>
    </div>
  );
}
