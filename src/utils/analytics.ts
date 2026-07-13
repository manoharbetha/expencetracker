// Read GA4 Measurement ID from environment variables
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let ReactGA: any = null;
let isInitialized = false;
let isInitializing = false;
let queue: Array<() => void> = [];

/**
 * Initializes Google Analytics 4 safely using dynamic imports to optimize bundle size.
 */
export const initGA = async () => {
  if (isInitialized || isInitializing) return;

  if (!MEASUREMENT_ID) {
    console.warn('GA4: VITE_GA_MEASUREMENT_ID is not configured. Analytics will run in log-only mode.');
    return;
  }

  isInitializing = true;
  try {
    const module = await import('react-ga4');
    ReactGA = module.default;
    ReactGA.initialize(MEASUREMENT_ID);
    isInitialized = true;
    console.log('GA4: Initialized successfully with ID:', MEASUREMENT_ID);
    
    // Process queue
    queue.forEach((fn) => fn());
    queue = [];
  } catch (error) {
    console.error('GA4: Initialization failed:', error);
  } finally {
    isInitializing = false;
  }
};

/**
 * Automatically tracks a page view, stripping any query parameters to avoid leaking PII.
 */
export const trackPageView = (path: string) => {
  const cleanPath = path.split('?')[0];
  if (isInitialized && ReactGA) {
    ReactGA.send({ hitType: 'pageview', page: cleanPath });
  } else {
    queue.push(() => {
      if (ReactGA) ReactGA.send({ hitType: 'pageview', page: cleanPath });
    });
    console.log(`GA4 [Log PageView (Queued)]: ${cleanPath}`);
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
  if (isInitialized && ReactGA) {
    ReactGA.event(eventName, cleanParams);
  } else {
    queue.push(() => {
      if (ReactGA) ReactGA.event(eventName, cleanParams);
    });
    console.log(`GA4 [Log Event (Queued)]: ${eventName}`, cleanParams);
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
