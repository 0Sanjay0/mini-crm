import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { getErrorMessage } from '../api/axios';

const NotifyContext = createContext(null);
const fallback = {
  success: () => {},
  error: (e) => console.warn('NotifyProvider missing in App.jsx:', e?.message),
};
// Never returns null, so a missing provider can't break onSuccess/onError handlers
export const useNotify = () => useContext(NotifyContext) ?? fallback;

// Shows a Snackbar whenever a query fails
export function useQueryError(error) {
  const notify = useNotify();
  useEffect(() => {
    if (error) notify.error(error);
  }, [error, notify]);
}

export function NotifyProvider({ children }) {
  const [msg, setMsg] = useState(null);

  const success = useCallback((text) => setMsg({ text, severity: 'success' }), []);
  const error = useCallback((err, fallback = 'Something went wrong') => {
    let text = getErrorMessage(err, fallback);
    const details = err?.response?.data?.errors;
    if (Array.isArray(details) && details.length) {
      text += ': ' + details.map((e) => e?.msg || e?.message || e).join(', ');
    }
    setMsg({ text, severity: 'error' });
  }, []);
  const value = useMemo(() => ({ success, error }), [success, error]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        open={!!msg}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== 'clickaway' && setMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={msg?.severity ?? 'info'} variant="filled" onClose={() => setMsg(null)}>
          {msg?.text}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}
