import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Modal = ({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-md animate-modal-backdrop" onMouseDown={onClose}>
      <div className="glass w-full max-w-xl rounded-modal p-5 animate-modal-content" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} onClick={onClose} aria-label="Close" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};
