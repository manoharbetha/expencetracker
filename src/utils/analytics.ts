import ReactGA from 'react-ga4';

// Read GA4 Measurement ID from environment variables
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let isInitialized = false;

/**
 * Initializes Google Analytics 4 safely.
 */
export const initGA = () => {
  if (isInitialized) return;

  if (!MEASUREMENT_ID) {
    console.warn('GA4: VITE_GA_MEASUREMENT_ID is not configured. Analytics will run in log-only mode.');
    return;
  }

  try {
    ReactGA.initialize(MEASUREMENT_ID);
    isInitialized = true;
    console.log('GA4: Initialized successfully with ID:', MEASUREMENT_ID);
  } catch (error) {
    console.error('GA4: Initialization failed:', error);
  }
};

/**
 * Automatically tracks a page view, stripping any query parameters to avoid leaking PII.
 */
export const trackPageView = (path: string) => {
  const cleanPath = path.split('?')[0];
  if (isInitialized) {
    ReactGA.send({ hitType: 'pageview', page: cleanPath });
  } else {
    console.log(`GA4 [Log PageView]: ${cleanPath}`);
  }
};

/**
 * Utility to scrub potential PII from event parameters before dispatching.
 */
const sanitizeParams = (params?: Record<string, any>): Record<string, any> | undefined => {
  if (!params) return undefined;
  
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    // Explicitly exclude any fields that might contain user identifiable information
    if (['email', 'name', 'password', 'token', 'user', 'userName', 'firstName', 'lastName'].includes(key)) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
};

/**
 * Tracks custom GA4 events with parameters.
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  const cleanParams = sanitizeParams(params);
  if (isInitialized) {
    ReactGA.event(eventName, cleanParams);
  } else {
    console.log(`GA4 [Log Event]: ${eventName}`, cleanParams);
  }
};

// --- Helper Stubs for Missing Features ---

/**
 * Tracks budget creation.
 * Wire this helper into the Budget modal/page onSuccess handler once created.
 */
export const trackBudgetCreated = (limit: number, category: string) => {
  trackEvent('budget_created', { limit, category });
};

/**
 * Tracks budget updates.
 * Wire this helper into the Budget update onSuccess handler once created.
 */
export const trackBudgetUpdated = (limit: number, category: string) => {
  trackEvent('budget_updated', { limit, category });
};

/**
 * Tracks budget deletion.
 * Wire this helper into the Budget delete onSuccess handler once created.
 */
export const trackBudgetDeleted = (budgetId: string) => {
  trackEvent('budget_deleted', { budget_id: budgetId });
};

/**
 * Tracks report exports.
 * Wire this helper into the export/download function once created.
 */
export const trackReportExported = (reportType: string, format: string) => {
  trackEvent('report_exported', { report_type: reportType, format });
};
