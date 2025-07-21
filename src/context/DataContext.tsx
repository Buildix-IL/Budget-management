import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  Supplier, Quote, Invoice, Payment, Settings, Statistics,
  SupplierFormData, QuoteFormData, InvoiceFormData, PaymentFormData,
  InvoiceStatus, QuoteStatus
} from '../types';

// State interface
interface DataState {
  suppliers: Supplier[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  settings: Settings;
  statistics: Statistics;
  loading: boolean;
}

// Action types
type DataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_DATA'; payload: Partial<DataState> }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: { id: string; data: Partial<Supplier> } }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'ADD_QUOTE'; payload: Quote }
  | { type: 'UPDATE_QUOTE'; payload: { id: string; data: Partial<Quote> } }
  | { type: 'DELETE_QUOTE'; payload: string }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: { id: string; data: Partial<Invoice> } }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'DELETE_PAYMENT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'CALCULATE_STATISTICS' };

// Context interface
interface DataContextType {
  state: DataState;
  // Suppliers
  addSupplier: (data: SupplierFormData) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => Supplier | null;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
  validateSupplier: (data: SupplierFormData) => string[];
  // Quotes
  addQuote: (data: QuoteFormData) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => Quote | null;
  deleteQuote: (id: string) => void;
  getQuoteById: (id: string) => Quote | undefined;
  getQuotesBySupplier: (supplierId: string) => Quote[];
  // Invoices
  addInvoice: (data: InvoiceFormData) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => Invoice | null;
  deleteInvoice: (id: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  getUnpaidInvoices: () => Invoice[];
  // Payments
  addPayment: (data: PaymentFormData) => Payment;
  deletePayment: (id: string) => void;
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  // Utils
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

// Initial state
const initialState: DataState = {
  suppliers: [],
  quotes: [],
  invoices: [],
  payments: [],
  settings: {
    defaultVat: 18,
    currency: '₪',
    statuses: ['ממתין לתשלום', 'שולם', 'שולם חלקית', 'בוטל', 'באמצע ביצוע']
  },
  statistics: {
    totalDebts: 0,
    paidAmount: 0,
    remainingAmount: 0,
    activeQuotes: 0,
    totalInvoices: 0,
    totalSuppliers: 0
  },
  loading: true
};

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.data } : s
        )
      };
    
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(s => s.id !== action.payload)
      };
    
    case 'ADD_QUOTE':
      return { ...state, quotes: [...state.quotes, action.payload] };
    
    case 'UPDATE_QUOTE':
      return {
        ...state,
        quotes: state.quotes.map(q =>
          q.id === action.payload.id ? { ...q, ...action.payload.data } : q
        )
      };
    
    case 'DELETE_QUOTE':
      return {
        ...state,
        quotes: state.quotes.filter(q => q.id !== action.payload)
      };
    
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };
    
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload.data } : i
        )
      };
    
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(i => i.id !== action.payload)
      };
    
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
    
    case 'DELETE_PAYMENT':
      return {
        ...state,
        payments: state.payments.filter(p => p.id !== action.payload)
      };
    
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'CALCULATE_STATISTICS':
      const totalDebts = state.invoices.reduce((sum, inv) => {
        const finalAmount = inv.amount * (1 + inv.vat / 100);
        const discountAmount = inv.discountType === 'percentage' 
          ? finalAmount * (inv.discount / 100)
          : inv.discount;
        return sum + finalAmount - discountAmount;
      }, 0);
      
      const paidAmount = state.payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        ...state,
        statistics: {
          totalDebts,
          paidAmount,
          remainingAmount: totalDebts - paidAmount,
          activeQuotes: state.quotes.filter(q => q.status === 'pending').length,
          totalInvoices: state.invoices.length,
          totalSuppliers: state.suppliers.length
        }
      };
    
    default:
      return state;
  }
}

// Create context
const DataContext = createContext<DataContextType | null>(null);

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Utility functions
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const loadData = (key: string): any => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  };

  const saveData = (key: string, data: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  };

  // Load data on mount
  useEffect(() => {
    const suppliers = loadData('suppliers') || [];
    const quotes = loadData('quotes') || [];
    const invoices = loadData('invoices') || [];
    const payments = loadData('payments') || [];
    const settings = loadData('settings') || initialState.settings;

    dispatch({
      type: 'LOAD_DATA',
      payload: { suppliers, quotes, invoices, payments, settings, loading: false }
    });
  }, []);

  // Auto-save and calculate stats when data changes
  useEffect(() => {
    if (!state.loading) {
      saveData('suppliers', state.suppliers);
      saveData('quotes', state.quotes);
      saveData('invoices', state.invoices);
      saveData('payments', state.payments);
      saveData('settings', state.settings);
      dispatch({ type: 'CALCULATE_STATISTICS' });
    }
  }, [state.suppliers, state.quotes, state.invoices, state.payments, state.settings, state.loading]);

  // Supplier functions
  const addSupplier = (data: SupplierFormData): Supplier => {
    const supplier: Supplier = {
      id: generateId(),
      name: data.name,
      profession: data.profession,
      phone: data.phone || '',
      email: data.email || '',
      defaultVat: data.defaultVat || state.settings.defaultVat,
      fields: data.fields || {},
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
    return supplier;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>): Supplier | null => {
    const supplier = state.suppliers.find(s => s.id === id);
    if (supplier) {
      dispatch({ type: 'UPDATE_SUPPLIER', payload: { id, data } });
      return { ...supplier, ...data };
    }
    return null;
  };

  const deleteSupplier = (id: string): void => {
    dispatch({ type: 'DELETE_SUPPLIER', payload: id });
  };

  const getSupplierById = (id: string): Supplier | undefined => {
    return state.suppliers.find(s => s.id === id);
  };

  const validateSupplier = (data: SupplierFormData): string[] => {
    const errors: string[] = [];
    if (!data.name?.trim()) errors.push('שם הספק חובה');
    if (!data.profession?.trim()) errors.push('מקצוע חובה');
    if (!data.phone?.trim() && !data.email?.trim()) {
      errors.push('טלפון או אימייל חובה');
    }
    return errors;
  };

  // Quote functions
  const addQuote = (data: QuoteFormData): Quote => {
    const quote: Quote = {
      id: generateId(),
      supplierId: data.supplierId,
      description: data.description,
      amount: data.amount,
      status: data.status,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_QUOTE', payload: quote });
    return quote;
  };

  const updateQuote = (id: string, data: Partial<Quote>): Quote | null => {
    const quote = state.quotes.find(q => q.id === id);
    if (quote) {
      dispatch({ type: 'UPDATE_QUOTE', payload: { id, data } });
      return { ...quote, ...data };
    }
    return null;
  };

  const deleteQuote = (id: string): void => {
    dispatch({ type: 'DELETE_QUOTE', payload: id });
  };

  const getQuoteById = (id: string): Quote | undefined => {
    return state.quotes.find(q => q.id === id);
  };

  const getQuotesBySupplier = (supplierId: string): Quote[] => {
    return state.quotes.filter(q => q.supplierId === supplierId);
  };

  // Invoice functions
  const addInvoice = (data: InvoiceFormData): Invoice => {
    const supplier = getSupplierById(data.supplierId);
    const invoice: Invoice = {
      id: generateId(),
      supplierId: data.supplierId,
      quoteId: data.quoteId,
      description: data.description,
      amount: data.amount,
      vat: data.vat || supplier?.defaultVat || state.settings.defaultVat,
      discount: data.discount || 0,
      discountType: data.discountType || 'amount',
      status: data.status || 'ממתין לתשלום',
      dueDate: data.dueDate,
      paymentBreakdown: data.paymentBreakdown || [],
      notes: data.notes,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_INVOICE', payload: invoice });
    return invoice;
  };

  const updateInvoice = (id: string, data: Partial<Invoice>): Invoice | null => {
    const invoice = state.invoices.find(i => i.id === id);
    if (invoice) {
      dispatch({ type: 'UPDATE_INVOICE', payload: { id, data } });
      return { ...invoice, ...data };
    }
    return null;
  };

  const deleteInvoice = (id: string): void => {
    dispatch({ type: 'DELETE_INVOICE', payload: id });
  };

  const getInvoiceById = (id: string): Invoice | undefined => {
    return state.invoices.find(i => i.id === id);
  };

  const getUnpaidInvoices = (): Invoice[] => {
    return state.invoices.filter(i => i.status !== 'שולם' && i.status !== 'בוטל');
  };

  // Payment functions
  const addPayment = (data: PaymentFormData): Payment => {
    const payment: Payment = {
      id: generateId(),
      invoiceId: data.invoiceId,
      amount: data.amount,
      date: data.date,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_PAYMENT', payload: payment });
    return payment;
  };

  const deletePayment = (id: string): void => {
    dispatch({ type: 'DELETE_PAYMENT', payload: id });
  };

  const getPaymentsByInvoice = (invoiceId: string): Payment[] => {
    return state.payments.filter(p => p.invoiceId === invoiceId);
  };

  // Export/Import functions
  const exportData = (): string => {
    const exportData = {
      suppliers: state.suppliers,
      quotes: state.quotes,
      invoices: state.invoices,
      payments: state.payments,
      settings: state.settings,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          suppliers: data.suppliers || [],
          quotes: data.quotes || [],
          invoices: data.invoices || [],
          payments: data.payments || [],
          settings: data.settings || state.settings
        }
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };

  const value: DataContextType = {
    state,
    // Suppliers
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    validateSupplier,
    // Quotes
    addQuote,
    updateQuote,
    deleteQuote,
    getQuoteById,
    getQuotesBySupplier,
    // Invoices
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    getUnpaidInvoices,
    // Payments
    addPayment,
    deletePayment,
    getPaymentsByInvoice,
    // Utils
    exportData,
    importData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook
export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
} 