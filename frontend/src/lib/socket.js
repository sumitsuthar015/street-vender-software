import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Opens a live connection to the server for as long as the component is mounted.
 * `handlers` is { eventName: fn }. `onConnect` runs on every (re)connect, which is the
 * place to (re)join rooms and refresh data that may have changed while offline.
 */
export function useSocket({ token, handlers, onConnect, enabled = true }) {
  const handlersRef = useRef(handlers);
  const onConnectRef = useRef(onConnect);
  handlersRef.current = handlers;
  onConnectRef.current = onConnect;

  useEffect(() => {
    if (!enabled) return undefined;
    const socket = io({ auth: token ? { token } : {}, transports: ['websocket', 'polling'] });

    socket.on('connect', () => onConnectRef.current?.(socket));
    const names = Object.keys(handlersRef.current || {});
    names.forEach((name) => socket.on(name, (...args) => handlersRef.current[name]?.(...args)));

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, enabled]);
}
