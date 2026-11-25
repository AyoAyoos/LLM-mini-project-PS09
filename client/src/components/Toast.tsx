import type { ToastMessage } from '../types';
import { Icon } from './icons';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const icon = toast.tone === 'error' ? 'alert' : toast.tone === 'success' ? 'check' : 'info';

  return (
    <div className={`toast toast--${toast.tone}`} role="status" aria-live="polite">
      <Icon name={icon} size={14} />
      <span className="toast-message">{toast.message}</span>
      <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={onDismiss}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
