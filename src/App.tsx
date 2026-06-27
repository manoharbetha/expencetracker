import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useRoutes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routes } from './routes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  const location = useLocation();
  const element = useRoutes(routes, location);
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={
        <div className="flex h-screen flex-col items-center justify-center bg-void text-center p-4 text-primary">
          <h1 className="text-2xl font-bold text-rose mb-2">Something went wrong</h1>
          <p className="text-secondary max-w-md text-sm mb-4">An error occurred while loading this page. Please try refreshing.</p>
          <button onClick={() => window.location.reload()} className="rounded bg-blue px-4 py-2 text-sm font-semibold text-white">Reload</button>
        </div>
      }>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            {element}
          </motion.div>
        </AnimatePresence>
        <Toaster position="top-right" toastOptions={{ style: { background: '#131920', color: '#f1f5f9', border: '1px solid #243044' } }} />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
