import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({
  showToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 260);
  }, []);

  const showToast = useCallback((message, isError = false, href = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      // Keep at most 3 toasts visible
      const active = prev.slice(-2);
      return [...active, { id, message, isError, href, leaving: false }];
    });

    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`app-toast${t.isError ? ' error' : ''}${t.leaving ? ' toast-leaving' : ''}`}
            role="status"
          >
            <div className="toast-body">
              <span className="toast-symbol" aria-hidden="true">
                {t.isError ? '✕' : '✓'}
              </span>
              <span className="toast-text">{t.message}</span>
              {t.href && (
                <a className="toast-link" href={t.href}>
                  Review
                </a>
              )}
            </div>
            <button
              className="toast-close"
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              title="Close"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
