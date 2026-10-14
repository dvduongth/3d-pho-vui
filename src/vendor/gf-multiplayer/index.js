// GameForge's multiplayer client for the platform relay at `api/rt`
// (docs/specs/spec-backend-multiplayer.md R10). Platform code, copied into every game:
// change it in GameForge's templates/_base, never in a game.

/** Close codes an open connection retries on: shutdown, a dropped socket, server full, load failed. */
const RETRY_CODES = [1001, 1006, 4009, 4010];
const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000];

export class MultiplayerError extends Error {
  constructor(code) {
    super(`multiplayer connection closed (${code})`);
    this.name = 'MultiplayerError';
    this.code = code;
  }
}

function endpoint(path) {
  return new URL(`${import.meta.env.BASE_URL}${path}`, location.href);
}

function withDev(url) {
  // `vite build` sets DEV to false and drops this block: a deployed game never forwards it.
  if (import.meta.env.DEV) {
    let dev = null;
    try {
      dev = localStorage.getItem('gf_dev_email');
    } catch {
      dev = null;
    }
    if (dev) url.searchParams.set('dev', dev);
  }
  return url;
}

// `priv` asks the relay to create the room private if it has to create it: a room without
// Database is gone once its last connection drops, and the reconnect would otherwise make it public.
function socketUrl(room, priv) {
  const url = endpoint('api/rt');
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (room !== undefined) url.searchParams.set('room', room);
  if (priv) url.searchParams.set('private', '1');
  return withDev(url).href;
}

function parse(raw) {
  try {
    const msg = JSON.parse(raw);
    return msg && typeof msg === 'object' && typeof msg.t === 'string' ? msg : null;
  } catch {
    return null;
  }
}

export function connect(options = {}) {
  return new Promise((resolve, reject) => {
    const listeners = new Map();
    // The relay takes lowercase names only; a phone keyboard capitalises a typed code.
    let roomName =
      typeof options.room === 'string' ? options.room.trim().toLowerCase() : options.room;
    let welcome = null;
    let peers = [];
    let states = {};
    let hostId = '';
    let shared = null;
    let socket = null;
    let open = false;
    let timer = null;
    let left = false;
    let done = false;

    const emit = (kind, arg) => {
      for (const fn of [...(listeners.get(kind) ?? [])]) fn(arg);
    };

    const finish = (code) => {
      if (done) return;
      done = true;
      emit('close', { code });
    };

    const adopt = (msg) => {
      welcome = msg;
      roomName = msg.room;
      peers = msg.peers;
      states = msg.states;
      hostId = msg.host;
      shared = msg.shared;
    };

    const handle = (msg) => {
      switch (msg.t) {
        case 'event':
          return emit('event', { from: msg.from, data: msg.data });
        case 'snapshot':
          Object.assign(states, msg.states);
          return emit('snapshot', { tick: msg.tick, states: msg.states });
        case 'join':
          peers = [...peers, msg.peer];
          return emit('join', { peer: msg.peer });
        case 'leave':
          peers = peers.filter((p) => p.id !== msg.id);
          delete states[msg.id];
          return emit('leave', { id: msg.id });
        case 'host':
          hostId = msg.id;
          return emit('host', { id: msg.id });
        case 'shared':
          shared = msg.data;
          return emit('shared', { from: msg.from, data: msg.data });
        case 'error':
          return emit('error', { code: msg.code, message: msg.message });
      }
    };

    const write = (msg) => {
      if (!open || socket.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(msg));
      return true;
    };

    const conn = {
      get me() {
        return welcome.you;
      },
      get room() {
        return welcome.room;
      },
      get private() {
        return welcome.private;
      },
      get persisted() {
        return welcome.persisted;
      },
      get peers() {
        return peers;
      },
      get states() {
        return states;
      },
      get hostId() {
        return hostId;
      },
      get isHost() {
        return hostId === welcome.you.id;
      },
      get shared() {
        return shared;
      },
      get history() {
        return welcome.history;
      },
      send: (data, to) => write(to === undefined ? { t: 'event', data } : { t: 'event', data, to }),
      setState: (data) => write({ t: 'state', data }),
      setShared: (data) => write({ t: 'shared', data }),
      on(kind, fn) {
        if (!listeners.has(kind)) listeners.set(kind, new Set());
        listeners.get(kind).add(fn);
        return () => listeners.get(kind).delete(fn);
      },
      leave() {
        if (left) return;
        left = true;
        clearTimeout(timer);
        timer = null;
        if (socket) socket.close(1000);
        else finish(1000);
      },
    };

    const dial = (onWelcome, onRefused) => {
      const ws = new WebSocket(socketUrl(roomName, welcome?.private === true));
      socket = ws;
      open = false;
      ws.onmessage = (ev) => {
        if (ws !== socket) return;
        const msg = parse(ev.data);
        if (!msg) return;
        if (open) return handle(msg);
        if (msg.t !== 'welcome') return;
        open = true;
        adopt(msg);
        onWelcome();
      };
      ws.onclose = (ev) => {
        if (ws !== socket) return;
        const wasOpen = open;
        socket = null;
        open = false;
        // A socket closed while still connecting reports 1006; the player chose to leave.
        if (left) return finish(1000);
        if (wasOpen) retry(ev.code, 0);
        else onRefused(ev.code);
      };
    };

    // A reconnect is a new connection to the room the welcome named, so `new` and `quick` return
    // to the code they were given, not to a fresh room.
    const retry = (code, attempt) => {
      if (!RETRY_CODES.includes(code) || attempt >= BACKOFF_MS.length) return finish(code);
      timer = setTimeout(() => {
        timer = null;
        dial(
          () => emit('reconnect'),
          (next) => retry(next, attempt + 1),
        );
      }, BACKOFF_MS[attempt]);
    };

    dial(
      () => resolve(conn),
      (code) => {
        done = true;
        reject(new MultiplayerError(code));
      },
    );
  });
}

const roomsFailed = (...why) => {
  console.error('[multiplayer] rooms failed', ...why);
  return null;
};

export async function listRooms() {
  try {
    const res = await fetch(withDev(endpoint('api/rt/rooms')));
    if (!res.ok) return roomsFailed(res.status, await res.text().catch(() => ''));
    return await res.json();
  } catch (e) {
    return roomsFailed(e);
  }
}
