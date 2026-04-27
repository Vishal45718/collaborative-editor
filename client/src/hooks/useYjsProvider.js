import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function useYjsProvider(roomId, username) {
  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const [filesMap, setFilesMap] = useState(null);
  const [metaMap, setMetaMap] = useState(null); // shared room metadata (language, etc.)
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    const doc = new Y.Doc();
    const wsProvider = new WebsocketProvider(
      'ws://localhost:1234',
      roomId,
      doc
    );

    const files = doc.getMap('files');
    const meta  = doc.getMap('meta'); // ← NEW: shared metadata map

    setYdoc(doc);
    setProvider(wsProvider);
    setFilesMap(files);
    setMetaMap(meta);

    // Only the FIRST user (empty room) seeds the initial file + language.
    // Late joiners receive the existing state via Yjs sync – we must NOT
    // overwrite anything that is already there.
    wsProvider.on('sync', (isSynced) => {
      if (isSynced && files.keys().next().done) {
        // Room is truly empty – seed defaults
        const text = new Y.Text('console.log("Hello App!");\n');
        files.set('main.js', text);
        // Only set language if not already set by another client race
        if (!meta.get('language')) {
          meta.set('language', 'javascript');
        }
      }
    });

    const handleUnload = () => {
      if (wsProvider.awareness) {
        wsProvider.awareness.setLocalState(null);
      }
      wsProvider.destroy();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      wsProvider.destroy();
      doc.destroy();
    };
  }, [roomId]);

  // Handle awareness separately
  useEffect(() => {
    if (!provider || !username) return;

    const awareness = provider.awareness;

    const storedColor = sessionStorage.getItem(`userColor-${roomId}`);
    const colors = ['#f783ac', '#d9480f', '#74b816', '#1098ad', '#5c7cfa', '#fcc419', '#20c997'];
    const myColor = storedColor || colors[Math.floor(Math.random() * colors.length)];

    if (!storedColor) {
      sessionStorage.setItem(`userColor-${roomId}`, myColor);
    }

    awareness.setLocalStateField('user', {
      name: username,
      color: myColor,
      colorLight: myColor + '33',
    });

    const updateClients = () => {
      const states = awareness.getStates();
      const clientList = Array.from(states.values())
        .map(s => s.user)
        .filter(u => u && u.name);

      const uniqueClients = Array.from(
        new Map(clientList.map(item => [item.name, item])).values()
      );
      setClients(uniqueClients);
    };

    updateClients();
    awareness.on('change', updateClients);

    return () => awareness.off('change', updateClients);
  }, [provider, username, roomId]);

  return { provider, ydoc, filesMap, metaMap, clients };
}
