// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
}

// Supplier types
export interface Supplier extends BaseEntity {
  name: string;
  profession: string;
  phone: string;
  email: string;
  defaultVat: number;
  fields: Record<string, any>;
}

export interface SupplierFormData {
  name: string;
  profession: string;
  phone: string;
  email: string;
  defaultVat: number;
  fields?: Record<string, any>;
}

// Quote types
export type QuoteStatus = 'pending' | 'accepted' | 'rejected';

export interface Quote extends BaseEntity {
  supplierId: string;
  description: string;
  amount: number;
  status: QuoteStatus;
  notes?: string;
}

export interface QuoteFormData {
  supplierId: string;
  description: string;
  amount: number;
  status: QuoteStatus;
  notes?: string;
}

// Invoice types
export type InvoiceStatus = 'ממתין לתשלום' | 'שולם' | 'שולם חלקית' | 'בוטל' | 'באמצע ביצוע';

export interface PaymentBreakdown {
  id: string;
  amount: number;
  percentage?: number;
  date?: string;
  trigger?: string;
  paid: boolean;
}

export interface Invoice extends BaseEntity {
  supplierId: string;
  quoteId?: string;
  description: string;
  amount: number;
  vat: number;
  discount: number;
  discountType: 'amount' | 'percentage';
  status: InvoiceStatus;
  dueDate?: string;
  paymentBreakdown: PaymentBreakdown[];
  notes?: string;
}

export interface InvoiceFormData {
  supplierId: string;
  quoteId?: string;
  description: string;
  amount: number;
  vat: number;
  discount: number;
  discountType: 'amount' | 'percentage';
  status: InvoiceStatus;
  dueDate?: string;
  paymentBreakdown: PaymentBreakdown[];
  notes?: string;
}

// Payment types
export type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'credit_card' | 'other';

export interface Payment extends BaseEntity {
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentFormData {
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

// Settings types
export interface Settings {
  defaultVat: number;
  currency: string;
  statuses: InvoiceStatus[];
}

// Statistics types
export interface Statistics {
  totalDebts: number;
  paidAmount: number;
  remainingAmount: number;
  activeQuotes: number;
  totalInvoices: number;
  totalSuppliers: number;
} 