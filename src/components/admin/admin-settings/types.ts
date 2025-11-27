import type { AdminSettings } from '../admin-settings/services/admin-settings.service';

export interface AdminSettingsHookState {
  settings: AdminSettings;
  loading: boolean;
  saving: boolean;
  handleChange: (field: keyof AdminSettings, value: string | number) => void;
  handleSave: () => Promise<void>;
  handleReset: () => Promise<void>;
}




