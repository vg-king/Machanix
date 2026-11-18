import { useEffect, useState } from 'react';
import { getHealth } from '../services/api.js';

export function useApiStatus() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => { if (active) setApiStatus('online'); })
      .catch(() => { if (active) setApiStatus('offline'); });
    return () => { active = false; };
  }, []);

  return apiStatus;
}
