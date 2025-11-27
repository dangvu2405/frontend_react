const STORAGE_KEY = 'adminSettings';

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  email: string;
  phone: string;
  address: string;
  paginationLimit: number;
  maxUploadSize: number;
}

const DEFAULT_SETTINGS: AdminSettings = {
  siteName: 'Acme Inc.',
  siteDescription: 'Hệ thống quản lý bán hàng',
  email: '',
  phone: '',
  address: '',
  paginationLimit: 10,
  maxUploadSize: 5,
};

export const adminSettingsService = {
  getSettings: async (): Promise<AdminSettings> => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: async (settings: AdminSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  resetSettings: async () => {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
  },

  defaultSettings: DEFAULT_SETTINGS,
};




