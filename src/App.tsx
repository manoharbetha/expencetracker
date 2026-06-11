import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useRoutes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { routes } from './routes';

export default function App() {
  const location = useLocation();
  const element = useRoutes(routes, location);
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          {element}
        </motion.div>
      </AnimatePresence>
      <Toaster position="top-right" toastOptions={{ style: { background: '#131920', color: '#f1f5f9', border: '1px solid #243044' } }} />
    </>
  );
}
