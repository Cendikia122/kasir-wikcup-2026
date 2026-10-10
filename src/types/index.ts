export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password: string; // simple plaintext for demo
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  hpp: number;
  stock: number;
  imageUrl: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  hpp: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface Order {
  id: string;
  receiptNo: string;
  buyerName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  cashierName?: string;
  cashReceived?: number;
  change?: number;
}
