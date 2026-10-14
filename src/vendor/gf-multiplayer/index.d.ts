/** One connection in the room. The same email in two tabs is two peers. */
export type Peer = { id: string; email: string; username: string };

/** This connection; `saved` is this email's last saved state in this room, `null` when unsaved. */
export type Me = Peer & { saved: unknown };

/** A broadcast event from before this join, oldest first; `at` is ISO UTC. */
export type HistoryEntry = { from: { email: string; username: string }; data: unknown; at: string };

/** A live, public, non-full room, as `listRooms()` returns it. */
export type RoomInfo = { room: string; players: number; max: number };

export type ErrorCode = 'BAD_MESSAGE' | 'NOT_HOST' | 'UNKNOWN_PEER' | 'RATE_LIMITED';

export type ConnectionEvents = {
  /** Another connection's `send`; `from` is its peer id. */
  event: { from: string; data: unknown };
  /** Up to 15 a second: the peers whose state changed since the last one. */
  snapshot: { tick: number; states: Record<string, unknown> };
  join: { peer: Peer };
  leave: { id: string };
  /** The host left; `id` is the new host. */
  host: { id: string };
  /** The host's `setShared`, received by everyone including the host. */
  shared: { from: string; data: unknown };
  error: { code: ErrorCode; message: string };
  /** A dropped connection is back: `me`, `peers`, `states`, `shared` and `history` are new. */
  reconnect: void;
  /** For good: `leave()`, a refusal, or the fifth failed reconnect. */
  close: { code: number };
};

export interface Connection {
  readonly me: Me;
  /** The room's name; for `new` and `quick` the code the relay gave it. */
  readonly room: string;
  readonly private: boolean;
  /** Whether this room is saved. False: nothing survives the last player leaving. */
  readonly persisted: boolean;
  /** Every other connection in the room. */
  readonly peers: Peer[];
  /** Every other peer's last state, by peer id. */
  readonly states: Record<string, unknown>;
  readonly hostId: string;
  readonly isHost: boolean;
  /** The room's shared blob, `null` when never set. */
  readonly shared: unknown;
  readonly history: HistoryEntry[];
  /** An event to everyone else, or only to peer `to`. False when not connected (dropped). */
  send(data: unknown, to?: string): boolean;
  /** Replaces this connection's state, sent to the others on the next snapshot. */
  setState(data: unknown): boolean;
  /** Host only: replaces the room's shared blob. */
  setShared(data: unknown): boolean;
  /** Returns a function that removes the listener. */
  on<K extends keyof ConnectionEvents>(
    kind: K,
    fn: (e: ConnectionEvents[K]) => void,
  ): () => void;
  leave(): void;
}

/** `connect()` refused: `code` is the close code (4001 no identity, 4003 full, 4004 bad name, …). */
export declare class MultiplayerError extends Error {
  readonly code: number;
  constructor(code: number);
}

/**
 * `room`: absent or `world` for everyone online, `new` for a private code, `quick`, or a name.
 * Trimmed and lowercased first, so a code typed with capitals still joins.
 */
export declare function connect(options?: { room?: string }): Promise<Connection>;

/** Resolves `null` after one `console.error` when the call fails. */
export declare function listRooms(): Promise<RoomInfo[] | null>;
