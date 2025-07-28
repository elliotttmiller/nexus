export interface Account {
  id: string;
  name: string;
  balance: number;
  mask?: string;
  last4?: string;
  type: 'depository' | 'credit' | 'loan' | 'investment' | string;
  subtype?: string;
  apr?: number;
  creditLimit?: number;
  credit_health?: number;
  creditHealth?: number; // camelCase alias for UI
  monthly_interest?: number;
  monthlyInterest?: number; // camelCase alias for UI
  institution?: string;
  promo_apr_expiry_date?: string | null;
  credit_limit?: number;
  card_name?: string;
}

export interface Transaction {
  id: string;
  name?: string;
  description?: string;
  amount: number;
  date: string;
  category?: string[];
  payment_channel?: string;
  transaction_id?: string;
  cards?: Array<{ card_id: string; amount: number; last4?: string }>;
  timestamp?: string;
  status?: string;
} 