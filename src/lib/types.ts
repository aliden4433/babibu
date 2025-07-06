
export type Product = {
  id?: string
  name: string
  price: number
  costPrice: number
  stock: number
  description?: string
  originalPrice?: number | null;
}

export type CartItem = {
  product: Product
  quantity: number
  price: number
}

export type SaleItem = {
  productId: string
  productName: string
  quantity: number
  price: number
  costPrice: number
  recordedBy?: {
    email: string | null;
    uid: string;
  };
}

export type Sale = {
  id: string
  transactionId: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  totalCost: number
  profit: number
  date: string
}

export type AppUser = {
  uid: string
  email: string | null
  role: "admin" | "cashier"
}

export type ExpenseCategoryDoc = {
  id: string;
  name: string;
  descriptions?: string[];
};

export type ExpenseCategory = string;

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  recordedBy?: {
    email: string | null;
    uid: string;
  };
};

export type ScheduledDiscountProduct = {
  productId: string;
  productName: string;
  originalPrice: number;
  discountPrice: number;
};

export type ScheduledDiscount = {
  id?: string;
  name: string;
  startDate: string; // ISO string
  endDate:string; // ISO string
  isActive: boolean;
  products: ScheduledDiscountProduct[];
};

export type ActivityLog = {
  id: string;
  timestamp: string; // ISO String
  user: {
    uid: string;
    email: string | null;
  };
  action: string;
  details: string;
};
