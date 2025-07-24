export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  last4: string;
  apr: number;
  monthlyInterest: number;
  creditHealth: number; // 0-100
  transactions: Transaction[];
} 