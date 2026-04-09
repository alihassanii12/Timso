'use client';

import { useEffect, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

type SSEHandler = (data: unknown) => void;

export function useSSE(handlers: Record<string, SSEHandler>, enabled = true) {
  const esRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token = localStorage.getItem('timso_token');
    if (!token) return;

    // Close existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${API}/api/sse`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.addEventListener('connected', () => {
      console.log('✅ SSE connected');
    });

    // Register all event handlers
    Object.keys(handlersRef.current).forEach(event => {
      es.addEventListener(event, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlersRef.current[event]?.(data);
        } catch {}
      });
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 5s
      setTimeout(connect, 5000);
    };
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
