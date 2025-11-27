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
export const debugApiRequest = (method: string, url: string, config?: any) => {
  if (!isDev) return;
  
  const params = config?.params ? `?${new URLSearchParams(config.params).toString()}` : '';
  const fullUrl = `${config?.baseURL || ''}${url}${params}`;
  
  console.log(`🔵 [API Request] ${method.toUpperCase()} ${fullUrl}`, {
    headers: config?.headers,
    data: config?.data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Debug logger for API success responses
 */
export const debugApiSuccess = (method: string, url: string, response: any) => {
  if (!isDev) return;
  
  const fullUrl = `${response?.config?.baseURL || ''}${url}`;
  
  console.log(`🟢 [API Success] ${method.toUpperCase()} ${fullUrl}`, {
    status: response?.status,
    statusText: response?.statusText,
    data: response?.data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Debug logger for API errors
 */
export const debugApiError = (method: string, url: string, error: any) => {
  if (!isDev) return;
  
  const fullUrl = error?.config 
    ? `${error.config.baseURL || ''}${error.config.url || ''}`
    : url;
  
  console.error(`🔴 [API Error] ${method.toUpperCase()} ${fullUrl}`, {
    status: error?.response?.status,
    statusText: error?.response?.statusText || error?.message,
    error: error?.response?.data || error?.message,
    headers: error?.response?.headers,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Debug logger for page operations
 */
export const debugPage = (pageName: string, operation: string, data?: any) => {
  if (!isDev) return;
  
  const emoji = getPageEmoji(pageName);
  console.log(`${emoji} [${pageName}] ${operation}`, data || {});
};

/**
 * Debug logger for page errors
 */
export const debugPageError = (pageName: string, operation: string, error: any) => {
  if (!isDev) return;
  
  const emoji = getPageEmoji(pageName);
  console.error(`${emoji} [${pageName}] ${operation}`, {
    error,
    message: error?.message,
    response: error?.response?.data,
  });
};

/**
 * Get emoji for page name
 */
const getPageEmoji = (pageName: string): string => {
  const emojiMap: Record<string, string> = {
    'Home Page': '🏠',
    'Products Page': '📦',
    'ProductDetail Page': '🔍',
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
    (window as any).__DEBUG_MODE__ = enabled;
  }
};

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = (): boolean => {
  if (typeof window !== 'undefined') {
    return (window as any).__DEBUG_MODE__ ?? isDev;
  }
  return isDev;
};

