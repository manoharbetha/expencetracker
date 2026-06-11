import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  to?: string;
}

export const MagneticButton = ({ children, className = '', onClick, to }: Props) => {
  const content = (
    <motion.div
      className={`relative inline-flex items-center justify-center px-8 py-4 font-bold text-white rounded-full overflow-hidden transition-transform cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Background base */}
      <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-md border border-white/20 rounded-full" />
      
      {/* Animated glowing gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80" />
      
      {/* Continuous Shimmer Sweep */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
      
      <span className="relative z-10 flex items-center gap-2 drop-shadow-md">{children}</span>
    </motion.div>
  );

  if (to) {
    return <Link to={to} className="inline-block">{content}</Link>;
  }

  return content;
};
