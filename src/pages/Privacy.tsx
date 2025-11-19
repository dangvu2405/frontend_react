import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold">Chính sách quyền riêng tư</CardTitle>
            <p className="text-muted-foreground mt-2">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-base leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Thông tin chúng tôi thu thập</h2>
              <p className="text-muted-foreground mb-4">
                Chúng tôi thu thập thông tin bạn cung cấp trực tiếp khi đăng ký tài khoản, đặt hàng, 
                hoặc liên hệ với chúng tôi. Thông tin này bao gồm:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Thông tin cá nhân: Họ tên, email, số điện thoại, địa chỉ</li>
                <li>Thông tin thanh toán: Thông tin thẻ tín dụng, tài khoản ngân hàng</li>
                <li>Thông tin đăng nhập: Tên đăng nhập, mật khẩu (được mã hóa)</li>
                <li>Thông tin từ OAuth: Khi bạn đăng nhập bằng Google hoặc Facebook</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Cách chúng tôi sử dụng thông tin</h2>
              <p className="text-muted-foreground mb-4">
                Chúng tôi sử dụng thông tin thu thập để:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Xử lý và giao hàng đơn hàng của bạn</li>
                <li>Gửi thông báo về đơn hàng và dịch vụ</li>
                <li>Cải thiện trải nghiệm người dùng</li>
                <li>Bảo mật và ngăn chặn gian lận</li>
                <li>Tuân thủ các yêu cầu pháp lý</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Chia sẻ thông tin</h2>
              <p className="text-muted-foreground">
                Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba, 
                trừ khi:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Bạn đã đồng ý</li>
                <li>Cần thiết để cung cấp dịch vụ (ví dụ: đối tác vận chuyển)</li>
                <li>Yêu cầu bởi pháp luật</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Quyền của bạn</h2>
              <p className="text-muted-foreground mb-4">
                Bạn có quyền:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Truy cập và chỉnh sửa thông tin cá nhân</li>
                <li>Yêu cầu xóa tài khoản và dữ liệu</li>
                <li>Từ chối nhận email marketing</li>
                <li>Yêu cầu xuất dữ liệu cá nhân</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Bảo mật</h2>
              <p className="text-muted-foreground">
                Chúng tôi sử dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn, 
                bao gồm mã hóa SSL/TLS và lưu trữ an toàn.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Liên hệ</h2>
              <p className="text-muted-foreground">
                Nếu bạn có câu hỏi về chính sách này, vui lòng liên hệ với chúng tôi qua email 
                hoặc trang <a href="/contact" className="text-primary hover:underline">Liên hệ</a>.
              </p>
            </section>

            <section className="pt-6 border-t">
              <h2 className="text-2xl font-semibold mb-4">Xóa dữ liệu Facebook</h2>
              <p className="text-muted-foreground">
                Nếu bạn đã đăng nhập bằng Facebook và muốn xóa dữ liệu của mình, bạn có thể yêu cầu 
                xóa dữ liệu thông qua ứng dụng Facebook của bạn trong phần Cài đặt &gt; Ứng dụng và trang web.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

