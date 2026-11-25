import { Client } from '@stomp/stompjs';
import { tokenStore } from '../api/client';

/** Live chat for one booking over STOMP/WebSocket. Returns a function that disconnects. */
export function connectChat(bookingId, onMessage, onState) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const client = new Client({
    brokerURL: `${proto}://${window.location.host}/ws`,
    reconnectDelay: 4000,
    beforeConnect: () => { client.connectHeaders = { Authorization: 'Bearer ' + (tokenStore.get()?.accessToken || '') }; },
    onConnect: () => {
      onState(true);
      client.subscribe('/topic/booking.' + bookingId, (m) => { try { onMessage(JSON.parse(m.body)); } catch { /* ignore */ } });
    },
    onWebSocketClose: () => onState(false),
    onStompError: () => onState(false),
  });
  client.activate();
  return () => client.deactivate();
}
