import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from './config';

const HIGHLIGHT_MS = 6000;
const byNewest = (a, b) => (b.receivedAt || '').localeCompare(a.receivedAt || '');

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [loaded, setLoaded] = useState(false);
  const [newIds, setNewIds] = useState(() => new Set());

  const knownIds = useRef(new Set());
  const hasSnapshot = useRef(false);
  const timers = useRef([]);

  useEffect(() => {
    if (!BACKEND_URL) return undefined;

    const highlight = (ids) => {
      if (ids.length === 0) return;
      setNewIds((current) => new Set([...current, ...ids]));
      const timer = setTimeout(() => {
        setNewIds((current) => {
          const next = new Set(current);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }, HIGHLIGHT_MS);
      timers.current.push(timer);
    };

    const addLeads = (incoming) => {
      const fresh = incoming.filter(
        (lead) => lead && lead.id && !knownIds.current.has(lead.id)
      );
      if (fresh.length === 0) return [];
      fresh.forEach((lead) => knownIds.current.add(lead.id));
      setLeads((current) => [...fresh, ...current].sort(byNewest));
      return fresh.map((lead) => lead.id);
    };

    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', (reason) => {
      setStatus('reconnecting');
      if (reason === 'io server disconnect') socket.connect();
    });

    socket.on('connect_error', () => {
      setStatus((current) => (current === 'connecting' ? 'connecting' : 'reconnecting'));
    });

    socket.on('leads:init', (snapshot) => {
      const added = addLeads(Array.isArray(snapshot) ? snapshot : []);
      if (hasSnapshot.current) highlight(added);
      hasSnapshot.current = true;
      setLoaded(true);
    });

    socket.on('lead:new', (lead) => {
      highlight(addLeads([lead]));
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return { leads, status, loaded, newIds };
}
