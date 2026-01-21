import { useEffect, useState } from "react"
import adminService from "@/services/adminService"
import type { AdminVoucherPayload } from "@/types/models/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Trash2, 
  Search, 
  Filter, 
  Edit,
  Plus,
  X,
  BarChart3,
  TrendingUp,
  Ticket,
  Percent
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Voucher, VoucherStats } from "@/types/models"

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminVouchersPage() {
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [stats, setStats] = useState<VoucherStats | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Filter states
  const [search, setSearch] = useState<string>("")
  const [minGiaTri, setMinGiaTri] = useState<string>("")
  const [maxGiaTri, setMaxGiaTri] = useState<string>("")
  const [minSoLuong, setMinSoLuong] = useState<string>("")
  const [maxSoLuong, setMaxSoLuong] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("NgayTao")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    MaVoucher: "",
    NoiDung: "",
    GiaTri: "",
    SoLuong: "",
    NgayTao: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [currentPage, sortBy, sortOrder, search, minGiaTri, maxGiaTri, minSoLuong, maxSoLuong])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      }

      if (search.trim()) {
        params.search = search.trim()
      }
      if (minGiaTri) {
        params.minGiaTri = Number(minGiaTri)
      }
      if (maxGiaTri) {
        params.maxGiaTri = Number(maxGiaTri)
      }
      if (minSoLuong) {
        params.minSoLuong = Number(minSoLuong)
      }
      if (maxSoLuong) {
        params.maxSoLuong = Number(maxSoLuong)
      }

      const vouchersRes = await adminService.getVouchers(params)
      
      // Parse response - normalizeResponse đã giữ lại pagination
      const responseData = vouchersRes?.data
      let vouchersData: Voucher[] = []
      let pagination: { totalPages?: number; total?: number } | undefined

      if (responseData) {
        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'success' in responseData && 'data' in responseData) {
          if (Array.isArray(responseData.data)) {
            vouchersData = responseData.data
            pagination = (responseData as Record<string, unknown>).pagination as { totalPages?: number; total?: number } | undefined
          }
        } else if (Array.isArray(responseData)) {
          vouchersData = responseData
        } else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'data' in responseData) {
          if (Array.isArray(responseData.data)) {
            vouchersData = responseData.data
            pagination = (responseData as Record<string, unknown>).pagination as { totalPages?: number; total?: number } | undefined
          }
        }
      }
      
      if (!Array.isArray(vouchersData)) {
        vouchersData = []
      }

      setVouchers(vouchersData)
      if (pagination) {
        setTotalPages(pagination.totalPages || 1)
        setTotal(pagination.total || 0)
      }
    } catch (err: unknown) {
      console.error("Error fetching vouchers:", err)
      toast.error("Không thể tải danh sách voucher")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsRes = await adminService.getVoucherStats()
      
      // Parse response - normalizeResponse đã giữ lại structure
      const responseData = statsRes?.data
      let statsData: VoucherStats | null = null
      
      if (responseData) {
        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'success' in responseData && 'data' in responseData) {
          // data có thể là VoucherStats trực tiếp hoặc object có stats
          if (responseData.data && typeof responseData.data === 'object' && 'summary' in responseData.data) {
            statsData = responseData.data as VoucherStats
          } else if (responseData.data && typeof responseData.data === 'object' && 'stats' in responseData.data) {
            statsData = (responseData.data as Record<string, unknown>).stats as VoucherStats
          }
        } else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'summary' in responseData) {
          // responseData là VoucherStats trực tiếp
          statsData = responseData as VoucherStats
        } else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'data' in responseData) {
          if (responseData.data && typeof responseData.data === 'object' && 'summary' in responseData.data) {
            statsData = responseData.data as VoucherStats
          }
        }
      }
      
      setStats(statsData)
    } catch (err: unknown) {
      console.error("Error fetching stats:", err)
    }
  }

  const handleOpenDialog = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher)
      setFormData({
        MaVoucher: voucher.MaVoucher,
        NoiDung: voucher.NoiDung,
        GiaTri: voucher.GiaTri.toString(),
        SoLuong: voucher.SoLuong.toString(),
        NgayTao: voucher.NgayTao ? new Date(voucher.NgayTao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      })
    } else {
      setEditingVoucher(null)
      setFormData({
        MaVoucher: "",
        NoiDung: "",
        GiaTri: "",
        SoLuong: "",
        NgayTao: new Date().toISOString().split('T')[0],
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingVoucher(null)
    setFormData({
      MaVoucher: "",
      NoiDung: "",
      GiaTri: "",
      SoLuong: "",
      NgayTao: new Date().toISOString().split('T')[0],
    })
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.MaVoucher.trim()) {
      toast.error("Vui lòng nhập mã voucher")
      return
    }
    if (!formData.NoiDung.trim()) {
      toast.error("Vui lòng nhập nội dung voucher")
      return
    }
    if (!formData.GiaTri || Number(formData.GiaTri) < 0 || Number(formData.GiaTri) > 100) {
      toast.error("Giá trị voucher phải từ 0 đến 100")
      return
    }
    if (!formData.SoLuong || Number(formData.SoLuong) < 0) {
      toast.error("Số lượng voucher không được âm")
      return
    }

    try {
      const payload: Record<string, string | number> = {
        MaVoucher: formData.MaVoucher.trim(),
        NoiDung: formData.NoiDung.trim(),
        GiaTri: Number(formData.GiaTri),
        SoLuong: Number(formData.SoLuong),
      }

      if (formData.NgayTao) {
        payload.NgayTao = new Date(formData.NgayTao).toISOString()
      }

      if (editingVoucher) {
        await adminService.updateVoucher(editingVoucher._id, payload)
        toast.success("Cập nhật voucher thành công")
      } else {
        await adminService.createVoucher(payload as unknown as AdminVoucherPayload)
        toast.success("Tạo voucher thành công")
      }

      handleCloseDialog()
      fetchData()
      fetchStats()
    } catch (err: unknown) {
      console.error("Error saving voucher:", err)
      const errorRecord = err as Record<string, unknown>;
      const errorMessage = (((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined) || "Không thể lưu voucher"
      toast.error(errorMessage)
    }
  }

  const handleDeleteVoucher = (voucher: Voucher) => {
    setDeletingVoucher(voucher)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteVoucher = async () => {
    if (!deletingVoucher) return

    try {
      await adminService.deleteVoucher(deletingVoucher._id)
      toast.success("Xóa voucher thành công")
      setIsDeleteDialogOpen(false)
      setDeletingVoucher(null)
      fetchData()
      fetchStats()
    } catch (err: unknown) {
      console.error("Error deleting voucher:", err)
      toast.error("Không thể xóa voucher")
    }
  }

  const clearFilters = () => {
    setSearch("")
    setMinGiaTri("")
    setMaxGiaTri("")
    setMinSoLuong("")
    setMaxSoLuong("")
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng voucher</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary?.totalVouchers ?? 0}</div>
              <p className="text-xs text-muted-foreground">Tổng số mã giảm giá</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số lượng</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary?.totalQuantity ?? 0}</div>
              <p className="text-xs text-muted-foreground">Tổng số voucher có sẵn</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giá trị TB</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.summary?.avgGiaTri ? stats.summary.avgGiaTri.toFixed(1) : '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.summary?.minGiaTri ?? 0}% - {stats?.summary?.maxGiaTri ?? 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sắp hết</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary?.lowStock ?? 0}</div>
              <p className="text-xs text-muted-foreground">Voucher ≤ 10 cái</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý voucher</CardTitle>
              <CardDescription>
                Quản lý mã giảm giá và khuyến mãi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Lọc
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo voucher
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã hoặc nội dung voucher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg space-y-4 bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="minGiaTri">Giá trị tối thiểu (%)</Label>
                  <Input
                    id="minGiaTri"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={minGiaTri}
                    onChange={(e) => setMinGiaTri(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGiaTri">Giá trị tối đa (%)</Label>
                  <Input
                    id="maxGiaTri"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={maxGiaTri}
                    onChange={(e) => setMaxGiaTri(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minSoLuong">Số lượng tối thiểu</Label>
                  <Input
                    id="minSoLuong"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minSoLuong}
                    onChange={(e) => setMinSoLuong(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSoLuong">Số lượng tối đa</Label>
                  <Input
                    id="maxSoLuong"
                    type="number"
                    min="0"
                    placeholder="Không giới hạn"
                    value={maxSoLuong}
                    onChange={(e) => setMaxSoLuong(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="mb-4 flex items-center gap-2">
            <Label>Sắp xếp theo:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NgayTao">Ngày tạo</SelectItem>
                <SelectItem value="MaVoucher">Mã voucher</SelectItem>
                <SelectItem value="GiaTri">Giá trị</SelectItem>
                <SelectItem value="SoLuong">Số lượng</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Tăng dần" : "↓ Giảm dần"}
            </Button>
          </div>

          {/* Vouchers Table */}
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có voucher nào
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Mã voucher
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Nội dung
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Giá trị
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => (
                      <tr
                        key={voucher._id}
                        className="border-t hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-mono">
                            {voucher.MaVoucher}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate">{voucher.NoiDung}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={voucher.GiaTri >= 50 ? "default" : "secondary"}
                            className="font-semibold"
                          >
                            {voucher.GiaTri}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              voucher.SoLuong === 0
                                ? "destructive"
                                : voucher.SoLuong <= 10
                                ? "secondary"
                                : "default"
                            }
                          >
                            {voucher.SoLuong} cái
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(voucher.NgayTao ?? '')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(voucher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVoucher(voucher)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              <div className="text-sm text-muted-foreground text-center">
                Hiển thị {vouchers.length} / {total} voucher
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVoucher ? "Cập nhật voucher" : "Tạo voucher mới"}
            </DialogTitle>
            <DialogDescription>
              {editingVoucher
                ? "Cập nhật thông tin voucher"
                : "Điền thông tin để tạo voucher mới"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="MaVoucher">Mã voucher *</Label>
              <Input
                id="MaVoucher"
                placeholder="VD: SALE2024"
                value={formData.MaVoucher}
                onChange={(e) =>
                  setFormData({ ...formData, MaVoucher: e.target.value.toUpperCase() })
                }
                disabled={!!editingVoucher}
              />
              <p className="text-xs text-muted-foreground">
                Mã voucher sẽ được chuyển thành chữ hoa
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="NoiDung">Nội dung *</Label>
              <Textarea
                id="NoiDung"
                placeholder="Mô tả về voucher..."
                value={formData.NoiDung}
                onChange={(e) =>
                  setFormData({ ...formData, NoiDung: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="GiaTri">Giá trị (%) *</Label>
                <Input
                  id="GiaTri"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.GiaTri}
                  onChange={(e) =>
                    setFormData({ ...formData, GiaTri: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Phần trăm giảm giá (0-100%)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="SoLuong">Số lượng *</Label>
                <Input
                  id="SoLuong"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.SoLuong}
                  onChange={(e) =>
                    setFormData({ ...formData, SoLuong: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Số lượng voucher có sẵn
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="NgayTao">Ngày tạo</Label>
              <Input
                id="NgayTao"
                type="date"
                value={formData.NgayTao}
                onChange={(e) =>
                  setFormData({ ...formData, NgayTao: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingVoucher ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa voucher <strong>{deletingVoucher?.MaVoucher}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVoucher} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

