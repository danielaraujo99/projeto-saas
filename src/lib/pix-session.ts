/**
 * Persistência local da cobrança Pix de um pedido.
 *
 * Regra de negócio: cada pedido gera UMA única cobrança Pix. Se ela expirar,
 * não há regeração — o cliente precisa refazer o pedido.
 */

const KEY = "menuatlas-pix-sessions";

export type PixSession = {
  orderId: string;
  paymentId: number;
  code: string;
  createdAt: number;
  expiresAt: number;
};

type Store = Record<string, PixSession>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage cheio / indisponível */
  }
}

export function getPixSession(orderId: string): PixSession | null {
  return read()[orderId] ?? null;
}

export function savePixSession(session: PixSession) {
  const store = read();
  store[session.orderId] = session;
  write(store);
}

export function isPixExpired(session: PixSession | null | undefined): boolean {
  if (!session) return false;
  return Date.now() >= session.expiresAt;
}

export function pixRemainingMs(session: PixSession): number {
  return Math.max(0, session.expiresAt - Date.now());
}

export function pixTotalMs(session: PixSession): number {
  return Math.max(1, session.expiresAt - session.createdAt);
}

export function formatCountdown(ms: number): string {
  const mm = String(Math.floor(ms / 60000)).padStart(2, "0");
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${mm}:${ss}`;
}
