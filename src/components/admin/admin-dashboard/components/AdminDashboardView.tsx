import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';

import useAdminDashboard from '../hooks/useAdminDashboard';

const AdminDashboardView = () => {
  const { loading, summaryStats, topProductsChart, monthlyOrdersChart, topCustomersChart, error } = useAdminDashboard();

  return (
    <>
      <div className="@container/main">
        <SectionCards stats={summaryStats ?? {}} loading={loading} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={topProductsChart}
          loading={loading}
          title="Top sản phẩm bán chạy"
          description="Dựa trên số lượng sản phẩm đã bán"
        />
        <ChartAreaInteractive
          data={monthlyOrdersChart}
          loading={loading}
          title="Đơn hàng theo tháng"
          description="Tổng số đơn hàng và doanh thu mỗi tháng gần đây"
        />
        <ChartAreaInteractive
          data={topCustomersChart}
          loading={loading}
          title="Khách hàng nhiều đơn nhất"
          description="Những khách hàng có nhiều đơn hàng nhất"
        />
      </div>
      {error && <div className="px-4 text-sm text-destructive lg:px-0">{error}</div>}
    </>
  );
};

export default AdminDashboardView;




