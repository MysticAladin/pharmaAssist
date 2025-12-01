export const environment = {
  production: true,
  apiUrl: 'https://api.pharmaassist.ba/api',
  appName: 'PharmaAssist',
  appVersion: '1.0.0',

  // Feature flags
  enableDebugMode: false,
  enableMockData: false,

  // Auth settings
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  sessionTimeout: 30 * 60 * 1000, // 30 minutes

  // Pagination defaults
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],

  // File upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

  // Date/Time formats (Bosnia uses European format)
  dateFormat: 'dd.MM.yyyy',
  dateTimeFormat: 'dd.MM.yyyy HH:mm',
  timeFormat: 'HH:mm',

  // Currency settings
  currency: 'BAM', // Bosnia and Herzegovina Convertible Mark
  currencySymbol: 'KM',
  currencyLocale: 'bs-BA'
};
