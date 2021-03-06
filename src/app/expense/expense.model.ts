export interface Expense {
  id: string;

  _id: string;
  creator: string;
  category: string;
  title: string;
  currency: string;
  amount: number;
  date: Date;
  description: string;
  label: string;
  rank: number;

  version: number;
  locked: boolean;
  personal: boolean;
}