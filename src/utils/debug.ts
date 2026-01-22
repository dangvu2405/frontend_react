/**
 * Debug Utilities
 * 
 * Centralized debug logging for API calls and page operations.
 * Only logs in development mode.
 */

const isDev = import.meta.env.DEV;

/**
 * Debug logger for API requests
 */
export const debugApiRequest = (method: string, url: string, config?: unknown) => {
  if (!isDev) return;
  
  const configRecord = config as Record<string, unknown> | undefined;
  const params = configRecord?.params ? `?${new URLSearchParams(configRecord.params as Record<string, string>).toString()}` : '';
  const fullUrl = `${String(configRecord?.baseURL || '')}${url}${params}`;
  
  console.log(`🔵 [API Request] ${method.toUpperCase()} ${fullUrl}`, {
    headers: configRecord?.headers,
    data: configRecord?.data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Debug logger for API success responses
 */
export const debugApiSuccess = (method: string, url: string, response: unknown) => {
  if (!isDev) return;
  
  const responseRecord = response as Record<string, unknown>;
  const config = responseRecord?.config as Record<string, unknown> | undefined;
  const fullUrl = `${String(config?.baseURL || '')}${url}`;
  
  console.log(`🟢 [API Success] ${method.toUpperCase()} ${fullUrl}`, {
    status: responseRecord?.status,
    statusText: responseRecord?.statusText,
    data: responseRecord?.data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Debug logger for API errors
 */
export const debugApiError = (method: string, url: string, error: unknown) => {
  if (!isDev) return;
  
  const errorRecord = error as Record<string, unknown>;
  const errorConfig = errorRecord?.config as Record<string, unknown> | undefined;
  const fullUrl = errorConfig 
    ? `${String(errorConfig.baseURL || '')}${String(errorConfig.url || '')}`
    : url;
  const response = errorRecord?.response as Record<string, unknown> | undefined;
  console.error(`🔴 [API Error] ${method.toUpperCase()} ${fullUrl}`, {
    status: response?.status,
    statusText: (response?.statusText as string | undefined) || (errorRecord?.message as string | undefined),
    error: response?.data || errorRecord?.message,
    headers: response?.headers,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Debug logger for page operations
 */
export const debugPage = (pageName: string, operation: string, data?: unknown) => {
  if (!isDev) return;
  
  const emoji = getPageEmoji(pageName);
  console.log(`${emoji} [${pageName}] ${operation}`, data || {});
};

/**
 * Debug logger for page errors
 */
export const debugPageError = (pageName: string, operation: string, error: unknown) => {
  if (!isDev) return;
  
  const emoji = getPageEmoji(pageName);
  const errorRecord = error as Record<string, unknown>;
  const response = errorRecord?.response as Record<string, unknown> | undefined;
  console.error(`${emoji} [${pageName}] ${operation}`, {
    error,
    message: errorRecord?.message,
    response: response?.data,
  });
};

/**
 * Get emoji for page name
 */
const getPageEmoji = (pageName: string): string => {
  const emojiMap: Record<string, string> = {
    'Home Page': '🏠',
    'Projects Page': '📦',
    'ProjectDetail Page': '🔍',
    'Checkout Page': '💳',
    'MyAccount Page': '👤',
    'Cart Page': '🛒',
  };
  return emojiMap[pageName] || '📄';
};

/**
 * Enable/disable debug mode (for future use)
 */
export const setDebugMode = (enabled: boolean) => {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__DEBUG_MODE__ = enabled;
  }
};

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const debugMode = (window as unknown as Record<string, unknown>).__DEBUG_MODE__;
    return typeof debugMode === 'boolean' ? debugMode : isDev;
  }
  return isDev;
};

