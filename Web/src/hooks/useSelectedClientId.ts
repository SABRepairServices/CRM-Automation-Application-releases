'use client';

import { useEffect, useState } from 'react';

// Every page that reads localStorage.selectedClientId used to do it once in
// a mount-only effect, so switching clients from the header ClientSelector
// while already on one of those pages left them silently showing the
// previous client's data until a manual reload. ClientSelector dispatches
// this event on change; anything using the hook below reacts to it.
export const CLIENT_CHANGED_EVENT = 'clientChanged';

export function useSelectedClientId(): string {
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    setClientId(localStorage.getItem('selectedClientId') || '');

    const handleChange = () => {
      setClientId(localStorage.getItem('selectedClientId') || '');
    };
    window.addEventListener(CLIENT_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(CLIENT_CHANGED_EVENT, handleChange);
  }, []);

  return clientId;
}
