import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { adminSettingsService } from '../services/admin-settings.service';
import type { AdminSettingsHookState } from '../types';

export const useAdminSettings = (): AdminSettingsHookState => {
  const [settings, setSettings] = useState(adminSettingsService.defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminSettingsService
      .getSettings()
      .then((data) => setSettings(data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof typeof settings, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Number(value) || prev[field] : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminSettingsService.saveSettings(settings);
      toast.success('Đã lưu cài đặt thành công');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const defaults = await adminSettingsService.resetSettings();
    setSettings(defaults);
    toast.success('Đã reset cài đặt về mặc định');
  };

  return {
    settings,
    loading,
    saving,
    handleChange,
    handleSave,
    handleReset,
  };
};

export default useAdminSettings;




