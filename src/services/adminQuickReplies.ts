/**
 * Admin Quick Replies Service
 * Các câu trả lời nhanh cho admin khi chat với khách hàng
 */

export interface QuickReply {
  id: string;
  label: string;
  message: string;
  category: 'greeting' | 'closing' | 'common' | 'support';
}

/**
 * Danh sách các câu trả lời nhanh cho admin
 */
export const adminQuickReplies: QuickReply[] = [
  // Bắt đầu cuộc trò chuyện
  {
    id: 'greeting-1',
    label: 'Xin chào',
    message: 'Xin chào! Tôi là nhân viên tư vấn của Perfume Shop. Tôi có thể giúp gì cho bạn?',
    category: 'greeting',
  },
  {
    id: 'greeting-2',
    label: 'Chào mừng',
    message: 'Chào mừng bạn đến với Perfume Shop! 👋 Bạn cần hỗ trợ gì hôm nay?',
    category: 'greeting',
  },
  {
    id: 'greeting-3',
    label: 'Cảm ơn đã liên hệ',
    message: 'Cảm ơn bạn đã liên hệ với chúng tôi! Tôi sẽ hỗ trợ bạn ngay. Bạn cần tư vấn về sản phẩm nào?',
    category: 'greeting',
  },

  // Kết thúc cuộc trò chuyện
  {
    id: 'closing-1',
    label: 'Cảm ơn và chào',
    message: 'Cảm ơn bạn đã liên hệ với chúng tôi! Nếu cần hỗ trợ thêm, đừng ngần ngại liên hệ lại. Chúc bạn một ngày tốt lành! 😊',
    category: 'closing',
  },
  {
    id: 'closing-2',
    label: 'Hẹn gặp lại',
    message: 'Rất vui được hỗ trợ bạn! Hẹn gặp lại bạn lần sau. Chúc bạn mua sắm vui vẻ! 🛍️',
    category: 'closing',
  },
  {
    id: 'closing-3',
    label: 'Kết thúc',
    message: 'Cuộc trò chuyện đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!',
    category: 'closing',
  },

  // Câu trả lời thường dùng
  {
    id: 'common-1',
    label: 'Vui lòng đợi',
    message: 'Vui lòng đợi một chút, tôi đang kiểm tra thông tin cho bạn.',
    category: 'common',
  },
  {
    id: 'common-2',
    label: 'Đang kiểm tra',
    message: 'Để tôi kiểm tra thông tin và phản hồi lại bạn trong giây lát.',
    category: 'common',
  },
  {
    id: 'common-3',
    label: 'Xác nhận',
    message: 'Tôi đã nhận được yêu cầu của bạn. Tôi sẽ xử lý và phản hồi sớm nhất có thể.',
    category: 'common',
  },
  {
    id: 'common-4',
    label: 'Cần thêm thông tin',
    message: 'Để tôi hỗ trợ bạn tốt hơn, bạn có thể cung cấp thêm một số thông tin không?',
    category: 'common',
  },

  // Hỗ trợ sản phẩm
  {
    id: 'support-1',
    label: 'Tư vấn sản phẩm',
    message: 'Bạn đang quan tâm đến sản phẩm nào? Tôi có thể tư vấn chi tiết cho bạn.',
    category: 'support',
  },
  {
    id: 'support-2',
    label: 'Kiểm tra đơn hàng',
    message: 'Để kiểm tra đơn hàng, bạn vui lòng cung cấp mã đơn hàng hoặc số điện thoại đặt hàng.',
    category: 'support',
  },
  {
    id: 'support-3',
    label: 'Hướng dẫn đặt hàng',
    message: 'Để đặt hàng, bạn có thể:\n1. Chọn sản phẩm và thêm vào giỏ hàng\n2. Vào giỏ hàng và thanh toán\n3. Chọn phương thức thanh toán và hoàn tất đơn hàng',
    category: 'support',
  },
  {
    id: 'support-4',
    label: 'Chính sách đổi trả',
    message: 'Chúng tôi hỗ trợ đổi trả trong 7 ngày kể từ ngày nhận hàng. Sản phẩm cần còn nguyên seal và có hóa đơn mua hàng.',
    category: 'support',
  },
  {
    id: 'support-5',
    label: 'Vận chuyển',
    message: 'Chúng tôi giao hàng toàn quốc trong 2-3 ngày làm việc. Miễn phí ship cho đơn hàng trên 500.000đ.',
    category: 'support',
  },
  {
    id: 'support-6',
    label: 'Thanh toán',
    message: 'Chúng tôi hỗ trợ nhiều phương thức thanh toán: COD, VNPay, MoMo, và chuyển khoản ngân hàng.',
    category: 'support',
  },
];

/**
 * Lấy quick replies theo category
 */
export const getQuickRepliesByCategory = (category: QuickReply['category']): QuickReply[] => {
  return adminQuickReplies.filter(reply => reply.category === category);
};

/**
 * Lấy tất cả quick replies
 */
export const getAllQuickReplies = (): QuickReply[] => {
  return adminQuickReplies;
};


