/**
 * Chatbot Service - Xử lý các câu trả lời tự động của chatbot
 * Sử dụng từ khóa để nhận diện ý định của người dùng
 */

interface BotResponse {
  message: string;
  suggestions?: string[]; // Gợi ý câu hỏi tiếp theo
  action?: 'transfer' | 'info'; // Hành động: chuyển sang CSKH hoặc chỉ cung cấp thông tin
}

interface KeywordRule {
  keywords: string[]; // Mảng từ khóa để match
  response: BotResponse;
  priority?: number; // Độ ưu tiên (số càng cao càng ưu tiên)
}

/**
 * Kiểm tra xem message có chứa bất kỳ từ khóa nào không
 */
const hasKeywords = (message: string, keywords: string[]): boolean => {
  return keywords.some(keyword => message.includes(keyword.toLowerCase()));
};

/**
 * Danh sách các rules với từ khóa và câu trả lời
 */
const chatbotRules: KeywordRule[] = [
  // Chào hỏi - Priority cao nhất
  {
    keywords: ['xin chào', 'chào', 'hello', 'hi', 'hey', 'chào bạn', 'chào bot', 'good morning', 'good afternoon', 'good evening'],
    priority: 100,
    response: {
      message:
        'Xin chào! 👋 Tôi là chatbot hỗ trợ của Perfume Shop. Tôi có thể giúp bạn:\n\n' +
        '• Tìm hiểu về sản phẩm\n' +
        '• Hướng dẫn đặt hàng\n' +
        '• Kiểm tra đơn hàng\n' +
        '• Chính sách đổi trả\n' +
        '• Vận chuyển và thanh toán\n' +
        '• Khuyến mãi và ưu đãi\n\n' +
        'Bạn cần hỗ trợ gì? Hoặc nhập "CSKH" để liên hệ với nhân viên tư vấn.',
      suggestions: [
        'Sản phẩm nước hoa',
        'Cách đặt hàng',
        'Chính sách đổi trả',
        'Khuyến mãi',
        'Liên hệ CSKH',
      ],
    },
  },

  // Liên hệ CSKH - Priority cao
  {
    keywords: ['cskh', 'nhân viên', 'tư vấn', 'liên hệ', 'chuyển', 'human', 'người', 'hỗ trợ', 'support', 'help'],
    priority: 90,
    response: {
      message:
        'Đang chuyển bạn đến nhân viên tư vấn...\n\n' +
        'Vui lòng đợi một chút, nhân viên sẽ phản hồi sớm nhất có thể. 👨‍💼',
      action: 'transfer',
    },
  },

  // Nước hoa nam
  {
    keywords: ['nước hoa nam', 'perfume nam', 'nam', 'male', 'men', 'cho nam', 'dành cho nam'],
    priority: 80,
    response: {
      message:
        'Nước hoa nam của chúng tôi:\n\n' +
        '• Đa dạng các thương hiệu nổi tiếng\n' +
        '• Mùi hương nam tính, mạnh mẽ\n' +
        '• Dung tích: 30ml, 50ml, 100ml\n' +
        '• Chính hãng 100%, có tem chống giả\n\n' +
        'Bạn có thể xem tất cả sản phẩm nước hoa nam tại trang sản phẩm.\n\n' +
        'Cần tư vấn chi tiết? Nhập "CSKH" để liên hệ.',
      suggestions: ['Giá nước hoa nam', 'Thương hiệu', 'Dung tích', 'Liên hệ CSKH'],
    },
  },

  // Nước hoa nữ
  {
    keywords: ['nước hoa nữ', 'perfume nữ', 'nữ', 'female', 'women', 'ladies', 'cho nữ', 'dành cho nữ'],
    priority: 80,
    response: {
      message:
        'Nước hoa nữ của chúng tôi:\n\n' +
        '• Nhiều thương hiệu cao cấp\n' +
        '• Mùi hương quyến rũ, thanh lịch\n' +
        '• Dung tích: 30ml, 50ml, 100ml\n' +
        '• Chính hãng 100%, có tem chống giả\n\n' +
        'Bạn có thể xem tất cả sản phẩm nước hoa nữ tại trang sản phẩm.\n\n' +
        'Cần tư vấn chi tiết? Nhập "CSKH" để liên hệ.',
      suggestions: ['Giá nước hoa nữ', 'Thương hiệu', 'Dung tích', 'Liên hệ CSKH'],
    },
  },

  // Sản phẩm chung
  {
    keywords: ['sản phẩm', 'nước hoa', 'sp', 'hàng', 'perfume', 'fragrance', 'sản phẩm nào', 'có gì'],
    priority: 70,
    response: {
      message:
        'Chúng tôi có đa dạng các loại nước hoa cao cấp:\n\n' +
        '• Nước hoa nam\n' +
        '• Nước hoa nữ\n' +
        '• Nước hoa unisex\n' +
        '• Combo/Giftset\n\n' +
        'Tất cả sản phẩm đều chính hãng 100%, có tem chống giả. Bạn có thể xem chi tiết tại trang sản phẩm.\n\n' +
        'Bạn muốn tìm loại nước hoa nào? Hoặc nhập "CSKH" để được tư vấn chi tiết.',
      suggestions: ['Nước hoa nam', 'Nước hoa nữ', 'Giá sản phẩm', 'Liên hệ CSKH'],
    },
  },

  // Giá cả
  {
    keywords: ['giá', 'price', 'bao nhiêu', 'cost', 'tiền', 'giá bao nhiêu', 'giá cả', 'mức giá'],
    priority: 70,
    response: {
      message:
        'Giá sản phẩm của chúng tôi:\n\n' +
        '• Được niêm yết công khai trên website\n' +
        '• Có nhiều mức giá phù hợp với từng sản phẩm\n' +
        '• Thường xuyên có chương trình khuyến mãi\n' +
        '• Giá từ 500.000đ - 5.000.000đ tùy sản phẩm\n\n' +
        'Bạn có thể xem giá chi tiết tại trang sản phẩm. Để được tư vấn về giá tốt nhất, nhập "CSKH" để liên hệ nhân viên.',
      suggestions: ['Khuyến mãi', 'Sản phẩm', 'Liên hệ CSKH'],
    },
  },

  // Khuyến mãi
  {
    keywords: ['khuyến mãi', 'giảm giá', 'sale', 'discount', 'promotion', 'ưu đãi', 'khuyến mại', 'giảm'],
    priority: 70,
    response: {
      message:
        'Chương trình khuyến mãi:\n\n' +
        '🎁 Thường xuyên có các chương trình giảm giá\n' +
        '🎁 Giảm giá theo % hoặc số tiền cụ thể\n' +
        '🎁 Combo/Giftset với giá ưu đãi\n' +
        '🎁 Khuyến mãi theo từng sản phẩm\n' +
        '🎁 Đăng ký nhận voucher giảm giá 20% cho đơn hàng đầu tiên\n\n' +
        'Bạn có thể xem các sản phẩm đang khuyến mãi tại trang sản phẩm.\n\n' +
        'Để biết thông tin khuyến mãi mới nhất, nhập "CSKH" để liên hệ.',
      suggestions: ['Sản phẩm', 'Giá sản phẩm', 'Liên hệ CSKH'],
    },
  },

  // Thanh toán
  {
    keywords: ['thanh toán', 'payment', 'pay', 'cod', 'vnpay', 'momo', 'chuyển khoản', 'trả tiền', 'tiền'],
    priority: 70,
    response: {
      message:
        'Chúng tôi hỗ trợ nhiều phương thức thanh toán:\n\n' +
        '💵 COD (Thanh toán khi nhận hàng)\n' +
        '   → Không cần thanh toán trước\n' +
        '   → Kiểm tra hàng trước khi thanh toán\n\n' +
        '💳 VNPay\n' +
        '   → Thanh toán online qua thẻ ATM/Visa/Mastercard\n' +
        '   → An toàn, nhanh chóng\n\n' +
        '📱 MoMo\n' +
        '   → Thanh toán qua ví điện tử MoMo\n' +
        '   → Tiện lợi, bảo mật\n\n' +
        '🏦 Chuyển khoản ngân hàng\n' +
        '   → Chuyển khoản trực tiếp\n' +
        '   → Thông tin tài khoản sẽ được gửi qua email\n\n' +
        'Cần hỗ trợ về thanh toán? Nhập "CSKH" để liên hệ.',
      suggestions: ['Đặt hàng', 'Vận chuyển', 'Liên hệ CSKH'],
    },
  },

  // Đặt hàng
  {
    keywords: ['đặt hàng', 'mua hàng', 'order', 'mua', 'purchase', 'mua như thế nào', 'cách mua'],
    priority: 70,
    response: {
      message:
        'Để đặt hàng, bạn có thể:\n\n' +
        '1️⃣ Thêm sản phẩm vào giỏ hàng\n' +
        '2️⃣ Vào giỏ hàng và kiểm tra\n' +
        '3️⃣ Chọn phương thức thanh toán\n' +
        '4️⃣ Xác nhận đơn hàng\n\n' +
        'Chúng tôi hỗ trợ thanh toán:\n' +
        '• COD (Thanh toán khi nhận hàng)\n' +
        '• VNPay\n' +
        '• MoMo\n' +
        '• Chuyển khoản ngân hàng\n\n' +
        'Bạn cần hỗ trợ thêm về đặt hàng? Nhập "CSKH" để liên hệ nhân viên.',
      suggestions: ['Thanh toán', 'Vận chuyển', 'Giỏ hàng', 'Liên hệ CSKH'],
    },
  },

  // Vận chuyển
  {
    keywords: ['vận chuyển', 'giao hàng', 'ship', 'shipping', 'delivery', 'giao', 'nhận hàng'],
    priority: 70,
    response: {
      message:
        'Thông tin vận chuyển:\n\n' +
        '🚚 Giao hàng toàn quốc\n' +
        '⏱️ Thời gian: 2-3 ngày làm việc\n' +
        '💰 Phí ship: Miễn phí cho đơn hàng trên 500.000đ\n' +
        '📍 Hỗ trợ giao hàng tận nơi\n\n' +
        'Bạn sẽ nhận được thông báo SMS khi đơn hàng được giao.\n\n' +
        'Cần hỗ trợ về vận chuyển? Nhập "CSKH" để liên hệ.',
      suggestions: ['Phí ship', 'Thời gian giao hàng', 'Theo dõi đơn hàng', 'Liên hệ CSKH'],
    },
  },

  // Phí ship
  {
    keywords: ['phí ship', 'phí vận chuyển', 'ship fee', 'phí giao hàng', 'tiền ship'],
    priority: 65,
    response: {
      message:
        'Phí vận chuyển:\n\n' +
        '💰 Miễn phí ship cho đơn hàng trên 500.000đ\n' +
        '💰 Phí ship 30.000đ cho đơn hàng dưới 500.000đ\n' +
        '💰 Giao hàng toàn quốc\n\n' +
        'Bạn có thể xem chi tiết phí ship khi thanh toán đơn hàng.\n\n' +
        'Cần hỗ trợ thêm? Nhập "CSKH" để liên hệ.',
      suggestions: ['Vận chuyển', 'Đặt hàng', 'Liên hệ CSKH'],
    },
  },

  // Thời gian giao hàng
  {
    keywords: ['thời gian', 'bao lâu', 'khi nào', 'time', 'giao khi nào', 'nhận khi nào'],
    priority: 65,
    response: {
      message:
        'Thời gian giao hàng:\n\n' +
        '⏱️ Thành phố lớn: 1-2 ngày làm việc\n' +
        '⏱️ Tỉnh thành khác: 2-3 ngày làm việc\n' +
        '⏱️ Vùng sâu vùng xa: 3-5 ngày làm việc\n\n' +
        'Thời gian tính từ khi đơn hàng được xác nhận.\n\n' +
        'Bạn sẽ nhận được thông báo SMS khi đơn hàng được giao.\n\n' +
        'Cần theo dõi đơn hàng? Nhập "CSKH" để liên hệ.',
      suggestions: ['Theo dõi đơn hàng', 'Đơn hàng', 'Liên hệ CSKH'],
    },
  },

  // Đơn hàng
  {
    keywords: ['đơn hàng', 'order', 'kiểm tra đơn', 'tra cứu', 'đơn của tôi', 'lịch sử đơn'],
    priority: 70,
    response: {
      message:
        'Để kiểm tra đơn hàng:\n\n' +
        '1️⃣ Đăng nhập vào tài khoản\n' +
        '2️⃣ Vào "Đơn hàng của tôi" hoặc "Tài khoản"\n' +
        '3️⃣ Xem chi tiết đơn hàng\n\n' +
        'Bạn sẽ thấy:\n' +
        '• Trạng thái đơn hàng\n' +
        '• Thông tin sản phẩm\n' +
        '• Địa chỉ giao hàng\n' +
        '• Phương thức thanh toán\n\n' +
        'Cần hỗ trợ về đơn hàng? Nhập "CSKH" để liên hệ.',
      suggestions: ['Hủy đơn hàng', 'Đổi trả', 'Theo dõi đơn hàng', 'Liên hệ CSKH'],
    },
  },

  // Hủy đơn hàng
  {
    keywords: ['hủy đơn', 'cancel', 'hủy', 'xóa đơn', 'hủy đơn hàng'],
    priority: 70,
    response: {
      message:
        'Chính sách hủy đơn hàng:\n\n' +
        '✅ Có thể hủy đơn hàng khi đơn ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận"\n' +
        '✅ Hủy đơn hàng trong phần "Đơn hàng của tôi"\n' +
        '✅ Nếu đã thanh toán, tiền sẽ được hoàn lại\n\n' +
        'Lưu ý:\n' +
        '• Đơn hàng đang giao không thể hủy\n' +
        '• Đơn hàng đã giao cần liên hệ CSKH để xử lý\n\n' +
        'Cần hỗ trợ hủy đơn hàng? Nhập "CSKH" để liên hệ.',
      suggestions: ['Đơn hàng', 'Đổi trả', 'Liên hệ CSKH'],
    },
  },

  // Đổi trả
  {
    keywords: ['đổi trả', 'hoàn tiền', 'refund', 'return', 'đổi hàng', 'trả hàng'],
    priority: 70,
    response: {
      message:
        'Chính sách đổi trả:\n\n' +
        '✅ Đổi trả trong 7 ngày kể từ ngày nhận hàng\n' +
        '✅ Sản phẩm còn nguyên seal, chưa sử dụng\n' +
        '✅ Có hóa đơn mua hàng\n\n' +
        'Quy trình:\n' +
        '1. Liên hệ CSKH để yêu cầu đổi trả\n' +
        '2. Gửi sản phẩm về kho\n' +
        '3. Kiểm tra và hoàn tiền\n\n' +
        'Nhập "CSKH" để được hỗ trợ đổi trả.',
      suggestions: ['Điều kiện đổi trả', 'Quy trình đổi trả', 'Liên hệ CSKH'],
    },
  },

  // Điều kiện đổi trả
  {
    keywords: ['điều kiện', 'condition', 'yêu cầu', 'điều kiện đổi trả'],
    priority: 65,
    response: {
      message:
        'Điều kiện đổi trả:\n\n' +
        '✅ Đổi trả trong 7 ngày kể từ ngày nhận hàng\n' +
        '✅ Sản phẩm còn nguyên seal, chưa mở\n' +
        '✅ Sản phẩm không bị hư hỏng\n' +
        '✅ Có hóa đơn mua hàng\n' +
        '✅ Không có dấu hiệu sử dụng\n\n' +
        'Không áp dụng cho:\n' +
        '❌ Sản phẩm đã mở seal\n' +
        '❌ Sản phẩm bị hư hỏng do người dùng\n' +
        '❌ Quá 7 ngày kể từ ngày nhận hàng\n\n' +
        'Nhập "CSKH" để được hỗ trợ đổi trả.',
      suggestions: ['Quy trình đổi trả', 'Liên hệ CSKH'],
    },
  },

  // Chất lượng / Chính hãng
  {
    keywords: ['chất lượng', 'chính hãng', 'authentic', 'genuine', 'tem chống giả', 'hàng thật', 'thật'],
    priority: 70,
    response: {
      message:
        'Cam kết chất lượng:\n\n' +
        '✅ 100% sản phẩm chính hãng\n' +
        '✅ Có tem chống giả từ nhà sản xuất\n' +
        '✅ Nhập khẩu trực tiếp từ các thương hiệu uy tín\n' +
        '✅ Đảm bảo chất lượng, mùi hương chuẩn\n' +
        '✅ Bảo hành chính hãng\n\n' +
        'Nếu phát hiện hàng giả, chúng tôi sẽ hoàn tiền 200%.\n\n' +
        'Cần tư vấn thêm? Nhập "CSKH" để liên hệ.',
      suggestions: ['Sản phẩm', 'Giá sản phẩm', 'Liên hệ CSKH'],
    },
  },

  // Thương hiệu
  {
    keywords: ['thương hiệu', 'brand', 'nhãn hiệu', 'hãng', 'brand nào', 'thương hiệu nào'],
    priority: 70,
    response: {
      message:
        'Chúng tôi cung cấp các thương hiệu nước hoa nổi tiếng:\n\n' +
        '• Các thương hiệu quốc tế cao cấp\n' +
        '• 100% chính hãng, có tem chống giả\n' +
        '• Đa dạng mùi hương và dung tích\n\n' +
        'Bạn có thể xem tất cả thương hiệu tại trang sản phẩm.\n\n' +
        'Cần tư vấn về thương hiệu cụ thể? Nhập "CSKH" để liên hệ.',
      suggestions: ['Sản phẩm', 'Giá sản phẩm', 'Liên hệ CSKH'],
    },
  },

  // Dung tích
  {
    keywords: ['dung tích', 'ml', 'size', 'kích thước', 'bao nhiêu ml', 'dung lượng'],
    priority: 65,
    response: {
      message:
        'Dung tích sản phẩm:\n\n' +
        '📦 30ml - Phù hợp để dùng thử\n' +
        '📦 50ml - Kích thước phổ biến\n' +
        '📦 100ml - Giá tốt nhất, tiết kiệm\n\n' +
        'Mỗi sản phẩm có thể có nhiều tùy chọn dung tích khác nhau.\n\n' +
        'Bạn có thể chọn dung tích khi thêm vào giỏ hàng.\n\n' +
        'Cần tư vấn? Nhập "CSKH" để liên hệ.',
      suggestions: ['Sản phẩm', 'Giá sản phẩm', 'Liên hệ CSKH'],
    },
  },

  // Tài khoản
  {
    keywords: ['tài khoản', 'đăng nhập', 'login', 'account', 'đăng ký', 'register', 'sign up'],
    priority: 70,
    response: {
      message:
        'Quản lý tài khoản:\n\n' +
        '📝 Đăng ký tài khoản miễn phí\n' +
        '🔐 Đăng nhập bằng email/username\n' +
        '🔐 Đăng nhập bằng Google OAuth\n' +
        '👤 Quản lý thông tin cá nhân\n' +
        '📦 Xem lịch sử đơn hàng\n' +
        '❤️ Quản lý sản phẩm yêu thích\n\n' +
        'Bạn có thể đăng ký/đăng nhập tại trang đăng nhập.\n\n' +
        'Cần hỗ trợ về tài khoản? Nhập "CSKH" để liên hệ.',
      suggestions: ['Đơn hàng', 'Sản phẩm yêu thích', 'Liên hệ CSKH'],
    },
  },

  // Liên hệ / Giờ làm việc
  {
    keywords: ['giờ làm việc', 'thời gian làm việc', 'working hours', 'hotline', 'số điện thoại', 'phone', 'email', 'liên hệ'],
    priority: 70,
    response: {
      message:
        'Thông tin liên hệ:\n\n' +
        '📞 Hotline: Liên hệ qua chat CSKH\n' +
        '📧 Email: Liên hệ qua chat CSKH\n' +
        '⏰ Hỗ trợ: 24/7 qua chatbot\n' +
        '👨‍💼 CSKH: 8:00 - 22:00 hàng ngày\n\n' +
        'Bạn có thể liên hệ với chúng tôi bất cứ lúc nào qua chat này.\n\n' +
        'Nhập "CSKH" để được kết nối với nhân viên tư vấn.',
      suggestions: ['Liên hệ CSKH', 'Hỗ trợ', 'Tư vấn'],
    },
  },

  // Cảm ơn
  {
    keywords: ['cảm ơn', 'thank', 'thanks', 'tạm biệt', 'bye', 'goodbye', 'thank you'],
    priority: 60,
    response: {
      message:
        'Cảm ơn bạn đã liên hệ với chúng tôi! 😊\n\n' +
        'Nếu bạn cần hỗ trợ thêm, đừng ngần ngại hỏi tôi.\n\n' +
        'Chúc bạn một ngày tốt lành! 🌟',
      suggestions: ['Sản phẩm', 'Đặt hàng', 'Liên hệ CSKH'],
    },
  },
];

/**
 * Phân tích câu hỏi và trả lời tự động
 */
export const chatbotService = {
  /**
   * Xử lý tin nhắn từ user và trả về phản hồi của bot
   * Sử dụng từ khóa để match
   */
  processMessage: (userMessage: string): BotResponse => {
    const message = userMessage.toLowerCase().trim();

    // Sắp xếp rules theo priority (cao nhất trước)
    const sortedRules = [...chatbotRules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Tìm rule đầu tiên match
    for (const rule of sortedRules) {
      if (hasKeywords(message, rule.keywords)) {
        return rule.response;
      }
    }

    // Không tìm thấy - trả về câu trả lời mặc định
    return {
      message:
        'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. 😅\n\n' +
        'Bạn có thể:\n' +
        '• Hỏi về sản phẩm\n' +
        '• Hỏi về đặt hàng\n' +
        '• Hỏi về vận chuyển\n' +
        '• Hỏi về đổi trả\n' +
        '• Hoặc nhập "CSKH" để liên hệ với nhân viên tư vấn',
      suggestions: ['Sản phẩm', 'Đặt hàng', 'Vận chuyển', 'Liên hệ CSKH'],
    };
  },

  /**
   * Lấy tin nhắn chào mừng khi mở chat
   */
  getWelcomeMessage: (): BotResponse => {
    return chatbotRules.find(r => r.keywords.includes('xin chào'))?.response || {
      message:
        'Xin chào! 👋\n\n' +
        'Tôi là chatbot hỗ trợ của Perfume Shop. Tôi có thể giúp bạn:\n\n' +
        '• Tìm hiểu về sản phẩm\n' +
        '• Hướng dẫn đặt hàng\n' +
        '• Kiểm tra đơn hàng\n' +
        '• Chính sách đổi trả\n' +
        '• Vận chuyển và thanh toán\n\n' +
        'Bạn cần hỗ trợ gì? Hoặc nhập "CSKH" để liên hệ với nhân viên tư vấn.',
      suggestions: [
        'Sản phẩm nước hoa',
        'Cách đặt hàng',
        'Chính sách đổi trả',
        'Liên hệ CSKH',
      ],
    };
  },
};
