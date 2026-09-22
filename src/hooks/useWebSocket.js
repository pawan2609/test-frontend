import { useEffect, useRef, useCallback, useState } from 'react';

const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 10000;

/**
 * Custom hook that manages a WebSocket connection to the backend.
 * Auto-reconnects with exponential backoff.
 *
 * @param {Object} handlers - Message handlers keyed by message type:
 *   { book, pricing, event, events, fill, order_update, hello }
 * @returns {{ connected: boolean, send: (data: any) => void }}
 */
export default function useWebSocket(handlers) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const handlersRef = useRef(handlers);
  const backoffRef = useRef(RECONNECT_BASE_MS);

  // Keep handlers ref up to date without re-triggering effect.
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    let destroyed = false;
    let reconnectTimer = null;

    function connect() {
      if (destroyed) return;

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${protocol}://${window.location.host}/ws`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        backoffRef.current = RECONNECT_BASE_MS;
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (!destroyed) {
          const delay = backoffRef.current;
          backoffRef.current = Math.min(delay * 2, RECONNECT_MAX_MS);
          reconnectTimer = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const h = handlersRef.current;
          if (msg.type && h[msg.type]) {
            h[msg.type](msg);
          }
        } catch {
          // ignore unparseable
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
