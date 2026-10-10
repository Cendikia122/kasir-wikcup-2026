import Cookies from 'js-cookie';
import { User } from '../types';
import { getStored, setStored, StorageKeys, SEED_USERS, runSeeder } from './seeder';

const SESSION_KEY = 'wik_session';

export interface Session {
  userId: string;
  name: string;
  role: 'admin' | 'user';
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  // 1. Try Cookie first (synced with HTTP Set-Cookie)
  try {
    const cookieVal = Cookies.get(SESSION_KEY);
    if (cookieVal) {
      let parsed: Session | null = null;
      try {
        parsed = JSON.parse(cookieVal);
      } catch {
        parsed = JSON.parse(decodeURIComponent(cookieVal));
      }
      if (parsed?.role) {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
        } catch {}
        return parsed;
      }
    }
  } catch {}

  // 2. Try localStorage fallback
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.role) {
        try {
          Cookies.set(SESSION_KEY, JSON.stringify(parsed), {
            expires: 7,
            path: '/',
            sameSite: 'Lax',
          });
        } catch {}
        return parsed;
      }
    }
  } catch {}

  return null;
}

export function setSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}

  try {
    Cookies.set(SESSION_KEY, JSON.stringify(session), {
      expires: 7,
      path: '/',
      sameSite: 'Lax',
    });
  } catch {}
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  try {
    Cookies.remove(SESSION_KEY, { path: '/' });
  } catch {}
  try {
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
  } catch {}
}

export function login(password: string): Session | null {
  runSeeder();
  const users = getStored<User[]>(StorageKeys.USERS, SEED_USERS);
  const user = users.find((u) => u.password === password);
  if (!user) return null;
  const session: Session = { userId: user.id, name: user.name, role: user.role };
  setSession(session);
  return session;
}

export function isAdmin(): boolean {
  const session = getSession();
  return session?.role === 'admin';
}
