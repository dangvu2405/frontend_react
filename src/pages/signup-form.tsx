import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formData, setFormData] = useState({
    hoten: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      await register({
        hoten: formData.hoten,
        username: formData.username,
        email: formData.email,
        sdt: formData.phone,
        password: formData.password,
      });
      navigate("/");
    } catch (error) {
      // console.error("Register error:", error);
      // const message = (error as any)?.message || "Đăng ký thất bại";
      // toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="p-8 md:p-12">
          <form
            className={cn("flex flex-col gap-6", className)}
            {...props}
            onSubmit={handleSubmit}
          >
            <FieldGroup>
              <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-bold text-foreground">Tạo tài khoản</h1>
                <p className="text-muted-foreground text-base">
                  Điền thông tin để tạo tài khoản của bạn
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-xl text-sm mb-6">
                  {error}
                </div>
              )}

              {/* Register Fields Container */}
              <div className="bg-muted/30 border-2 border-border rounded-2xl p-6 space-y-5 mb-6">
                <Field>
                  <FieldLabel htmlFor="hoten" className="text-base font-semibold">
                    Họ tên
                  </FieldLabel>
                  <Input
                    id="hoten"
                    name="hoten"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.hoten}
                    onChange={(e) =>
                      setFormData({ ...formData, hoten: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="username" className="text-base font-semibold">
                    Tên đăng nhập
                  </FieldLabel>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email" className="text-base font-semibold">
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Chúng tôi sẽ sử dụng email này để liên hệ với bạn
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone" className="text-base font-semibold">
                    Số điện thoại
                  </FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Nhập số điện thoại để nhận thông báo đơn hàng
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="password" className="text-base font-semibold">
                    Mật khẩu
                  </FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Tối thiểu 6 ký tự
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password" className="text-base font-semibold">
                    Xác nhận mật khẩu
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                    className="bg-background border-input h-14 text-base px-4"
                  />
                  <FieldDescription className="text-sm mt-1">
                    Nhập lại mật khẩu để xác nhận
                  </FieldDescription>
                </Field>
              </div>

              <Field>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </Button>
              </Field>

              <FieldDescription className="text-center text-base">
                Đã có tài khoản?{" "}
                <a href="/login" className="text-primary font-semibold hover:underline">
                  Đăng nhập
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
