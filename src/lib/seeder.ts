import { User, Product, Order } from '../types';

// ─── USERS ───────────────────────────────────────────────────
export const SEED_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'Admin Wikcup',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: 'u-kasir1',
    name: 'Siti Kasir',
    role: 'user',
    password: 'user123',
  },
];

// ─── PRODUCTS ─────────────────────────────────────────────────
export const SEED_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    code: 'MIN-01',
    name: 'Es Teh Jumbo',
    category: 'Minuman',
    price: 5000,
    hpp: 2500,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=75',
    description: 'Es teh manis segar ukuran jumbo',
  },
  {
    id: 'p-2',
    code: 'MIN-02',
    name: 'Matcha Latte',
    category: 'Minuman',
    price: 10000,
    hpp: 6000,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=75',
    description: 'Matcha latte dingin premium',
  },
  {
    id: 'p-3',
    code: 'MAK-01',
    name: 'Cireng Mercon',
    category: 'Camilan',
    price: 10000,
    hpp: 5500,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=400&q=75',
    description: 'Cireng isi ayam pedas level 3',
  },
  {
    id: 'p-4',
    code: 'MAK-02',
    name: 'Dimsum Mentai',
    category: 'Makanan',
    price: 15000,
    hpp: 8500,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=75',
    description: 'Dimsum 4 pcs dengan saus mentai',
  },
  {
    id: 'p-5',
    code: 'MAK-03',
    name: 'Rice Bowl Katsu',
    category: 'Makanan',
    price: 18000,
    hpp: 11000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=75',
    description: 'Rice bowl chicken katsu teriyaki',
  },
  {
    id: 'p-6',
    code: 'SNK-01',
    name: 'Brownies Bites',
    category: 'Camilan',
    price: 8000,
    hpp: 5000,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=75',
    description: 'Fudgy brownies cokelat premium',
  },
];

// ─── SAMPLE ORDERS ────────────────────────────────────────────
export const SEED_ORDERS: Order[] = [];

// ─── FIXED COSTS ──────────────────────────────────────────────
export const SEED_FIXED_COSTS = [
  { id: 'fc-1', name: 'Pendaftaran Stand', amount: 20000 },
  { id: 'fc-2', name: 'Dekorasi & Banner', amount: 35000 },
  { id: 'fc-3', name: 'Trash Bag & Kebersihan', amount: 10000 },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────
const KEYS = {
  USERS: 'wik_users',
  PRODUCTS: 'wik_products',
  ORDERS: 'wik_orders',
  FIXED_COSTS: 'wik_fixed_costs',
  SHEET_URL: 'wik_sheet_url',
  SEEDED: 'wik_seeded_v3',
};

export function runSeeder(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(KEYS.PRODUCTS) || !localStorage.getItem(KEYS.SEEDED)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(SEED_ORDERS));
    localStorage.setItem(KEYS.FIXED_COSTS, JSON.stringify(SEED_FIXED_COSTS));
    localStorage.setItem(KEYS.SEEDED, '1');
  }
}

export function resetAndReseed(): void {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
  runSeeder();
}

// Generic get/set helpers
export function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (
      Array.isArray(parsed) &&
      parsed.length === 0 &&
      Array.isArray(fallback) &&
      fallback.length > 0
    ) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

export function setStored<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export const StorageKeys = KEYS;
