import { useEffect, useMemo, useState } from "react"

import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import adminService from "@/services/adminService"
import type { ChartItem, SummaryStats } from "@/types/models"

const unwrapResponse = (payload: unknown): unknown => {
  if (!payload) return null
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const data = (payload as Record<string, unknown>).data
    // Avoid infinite loop if data references itself
    if (data !== payload) {
      return unwrapResponse(data)
    }
  }
  return payload
}

const toArray = (payload: unknown): unknown[] => {
  const data = unwrapResponse(payload)
  return Array.isArray(data) ? data : []
}

const normalizeSummary = (payload: unknown): SummaryStats => {
  const data = unwrapResponse(payload) ?? {}
  return {
    totalProjects: Number((data as Record<string, unknown>)?.totalProjects ?? 0),
    totalCategories: Number((data as Record<string, unknown>)?.totalCategories ?? 0),
    totalUsers: Number((data as Record<string, unknown>)?.totalUsers ?? 0),
    totalOrders: Number((data as Record<string, unknown>)?.totalOrders ?? 0),
    totalRevenue: Number((data as Record<string, unknown>)?.totalRevenue ?? 0),
  }
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
  const [topProjectsChart, setTopProjectsChart] = useState<ChartItem[]>([])
  const [monthlyOrdersChart, setMonthlyOrdersChart] = useState<ChartItem[]>([])
  const [topCustomersChart, setTopCustomersChart] = useState<ChartItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)

        const [
          summaryRes,
          topProjectsRes,
          monthlyOrdersRes,
          topCustomersRes,
        ] =
          await Promise.all([
            adminService.getSummaryStats(),
            adminService.getTopProjects({ limit: 8 }),
            adminService.getMonthlyOrdersStats({ months: 6 }),
            adminService.getTopCustomersByOrders({ limit: 6 }),
          ])

        if (!isMounted) return

        setSummaryStats(normalizeSummary(summaryRes))

        const topProjectData = toArray(topProjectsRes)

        setTopProjectsChart(
          topProjectData.map((project: unknown) => {
            const projectRecord = project as Record<string, unknown>;
            return {
              name: String(projectRecord?.TenSanPham ?? "Không tên"),
              sold: Number(projectRecord?.DaBan ?? 0),
              revenue:
                typeof projectRecord?.Gia === "number" && typeof projectRecord?.DaBan === "number"
                  ? projectRecord.Gia * projectRecord.DaBan
                  : undefined,
            };
          })
        )

        const monthlyOrdersData = toArray(monthlyOrdersRes)
        setMonthlyOrdersChart(
          monthlyOrdersData.map((item: unknown) => {
            const itemRecord = item as Record<string, unknown>;
            return {
              name: itemRecord?.month && itemRecord?.year
                ? `Tháng ${String(itemRecord.month).padStart(2, "0")}/${itemRecord.year}`
                : "Không xác định",
              sold: Number(itemRecord?.totalOrders ?? 0),
              revenue: Number(itemRecord?.totalRevenue ?? 0),
            };
          })
        )

        const topCustomersData = toArray(topCustomersRes)
        setTopCustomersChart(
          topCustomersData.map((customer: unknown, index: number) => {
            const customerRecord = customer as Record<string, unknown>;
            return {
              name:
                String(customerRecord?.name ||
                customerRecord?.email ||
                `Khách hàng ${index + 1}`),
              sold: Number(customerRecord?.orderCount ?? 0),
              revenue: Number(customerRecord?.totalRevenue ?? 0),
            };
          })
        )
      } catch (err: unknown) {
        if (!isMounted) return
        console.error("Lỗi khi tải dữ liệu admin:", err)
        const errorMsg = (err as Record<string, unknown>)?.message as string | undefined;
        setError(errorMsg ?? "Không thể tải dữ liệu admin")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const summaryForCards = useMemo(
    () => summaryStats ?? {},
    [summaryStats]
  )

  return (
    <>
      <div className="@container/main">
        <SectionCards stats={summaryForCards} loading={loading} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={topProjectsChart}
          loading={loading}
          title="Top đồ án bán chạy"
          description="Dựa trên số lượng đồ án đã bán"
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
      {error && (
        <div className="px-4 text-sm text-destructive lg:px-0">{error}</div>
      )}
    </>
  )
}

