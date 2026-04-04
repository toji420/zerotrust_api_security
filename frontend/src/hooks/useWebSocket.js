import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useWebSocket = (topics) => {
  const [messages, setMessages] = useState({});
  const clientRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        topics.forEach(topic => {
          client.subscribe(topic, (msg) => {
            try {
              const data = JSON.parse(msg.body);
              setMessages(prev => ({ ...prev, [topic]: data }));
            } catch (_) {}
          });
        });
      },
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, []);

  return messages;
};