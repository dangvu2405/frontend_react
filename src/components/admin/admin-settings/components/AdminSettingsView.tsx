import { RefreshCw, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import useAdminSettings from '../hooks/useAdminSettings';

const AdminSettingsView = () => {
  const { settings, loading, saving, handleChange, handleSave, handleReset } = useAdminSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">Quản lý các cài đặt chung của hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={loading || saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
            <CardDescription>Cài đặt thông tin cơ bản của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Tên hệ thống</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(event) => handleChange('siteName', event.target.value)}
                placeholder="Nhập tên hệ thống"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Mô tả hệ thống</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(event) => handleChange('siteDescription', event.target.value)}
                placeholder="Nhập mô tả"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email liên hệ</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="contact@example.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="0123 456 789"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(event) => handleChange('address', event.target.value)}
                placeholder="Nhập địa chỉ"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt hệ thống</CardTitle>
            <CardDescription>Các tham số kỹ thuật của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paginationLimit">Số lượng mục mỗi trang</Label>
              <Input
                id="paginationLimit"
                type="number"
                min="5"
                max="100"
                value={settings.paginationLimit}
                onChange={(event) => handleChange('paginationLimit', Number(event.target.value))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Số lượng mục hiển thị trên mỗi trang (5-100)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">Kích thước upload tối đa (MB)</Label>
              <Input
                id="maxUploadSize"
                type="number"
                min="1"
                max="50"
                value={settings.maxUploadSize}
                onChange={(event) => handleChange('maxUploadSize', Number(event.target.value))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Kích thước file upload tối đa (1-50 MB)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hệ thống</CardTitle>
          <CardDescription>Thông tin về phiên bản và trạng thái hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Phiên bản</Label>
              <p className="text-sm font-medium">1.0.0</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Trạng thái</Label>
              <p className="text-sm font-medium text-green-600">Hoạt động bình thường</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsView;




