export interface Todo {
  id: string;
  title: string;
  note: string;
  personal: boolean;
  creator: string;
  category: string[];
  created: Date;
  updated: Date;
  rank: Number;
}
