import { createContext, useCallback, useContext, useState } from 'react';
import ToastContainer from '../components/ui/ToastContainer';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      idCounter += 1;
      const id = idCounter;
      setToasts((t) => {
        const next = [...t, { id, type, message }];
        return next.slice(-3); // max 3 visible
      });
      setTimeout(() => remove(id), 4000);
      return id;
    },
    [remove]
  );

  const toast = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    warning: (m) => push('warning', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
