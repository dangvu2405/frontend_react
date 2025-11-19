import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold">Điều khoản dịch vụ</CardTitle>
            <p className="text-muted-foreground mt-2">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-base leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Chấp nhận điều khoản</h2>
              <p className="text-muted-foreground">
                Bằng việc truy cập và sử dụng website này, bạn đồng ý tuân thủ và bị ràng buộc bởi 
                các điều khoản và điều kiện sử dụng được nêu trong tài liệu này. Nếu bạn không đồng ý 
                với bất kỳ phần nào của các điều khoản này, bạn không được phép sử dụng dịch vụ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Sử dụng dịch vụ</h2>
              <p className="text-muted-foreground mb-4">
                Bạn được phép sử dụng dịch vụ của chúng tôi cho mục đích cá nhân và thương mại hợp pháp. 
                Bạn không được:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp nào</li>
                <li>Vi phạm bất kỳ luật pháp hoặc quy định nào</li>
                <li>Xâm phạm quyền của người khác</li>
                <li>Gây hại hoặc làm gián đoạn dịch vụ</li>
                <li>Thử nghiệm bảo mật hoặc tìm cách truy cập trái phép</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Tài khoản người dùng</h2>
              <p className="text-muted-foreground mb-4">
                Khi tạo tài khoản, bạn đồng ý:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Cung cấp thông tin chính xác và đầy đủ</li>
                <li>Bảo mật thông tin đăng nhập của bạn</li>
                <li>Chịu trách nhiệm cho mọi hoạt động dưới tài khoản của bạn</li>
                <li>Thông báo ngay cho chúng tôi nếu phát hiện vi phạm bảo mật</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Đơn hàng và thanh toán</h2>
              <p className="text-muted-foreground mb-4">
                Khi đặt hàng, bạn đồng ý:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Cung cấp thông tin thanh toán chính xác</li>
                <li>Thanh toán đầy đủ cho các sản phẩm/dịch vụ đã đặt</li>
                <li>Chấp nhận chính sách đổi trả và hoàn tiền của chúng tôi</li>
                <li>Chịu trách nhiệm về các khoản phí phát sinh</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Sở hữu trí tuệ</h2>
              <p className="text-muted-foreground">
                Tất cả nội dung trên website, bao gồm nhưng không giới hạn ở văn bản, đồ họa, logo, 
                hình ảnh, và phần mềm, là tài sản của chúng tôi hoặc được cấp phép sử dụng và được bảo vệ 
                bởi luật bản quyền và các luật sở hữu trí tuệ khác.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Miễn trừ trách nhiệm</h2>
              <p className="text-muted-foreground">
                Chúng tôi không đảm bảo rằng dịch vụ sẽ luôn hoạt động không bị gián đoạn hoặc không có lỗi. 
                Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc 
                không thể sử dụng dịch vụ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Thay đổi điều khoản</h2>
              <p className="text-muted-foreground">
                Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực 
                ngay sau khi được đăng tải trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi 
                được coi là bạn đã chấp nhận các điều khoản mới.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Chấm dứt dịch vụ</h2>
              <p className="text-muted-foreground">
                Chúng tôi có quyền chấm dứt hoặc tạm ngưng quyền truy cập của bạn vào dịch vụ bất cứ lúc nào, 
                với hoặc không có lý do, mà không cần thông báo trước.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Luật áp dụng</h2>
              <p className="text-muted-foreground">
                Các điều khoản này được điều chỉnh bởi và giải thích theo luật pháp Việt Nam. 
                Mọi tranh chấp sẽ được giải quyết tại tòa án có thẩm quyền tại Việt Nam.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Liên hệ</h2>
              <p className="text-muted-foreground">
                Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ với chúng tôi qua email 
                hoặc trang <a href="/contact" className="text-primary hover:underline">Liên hệ</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

