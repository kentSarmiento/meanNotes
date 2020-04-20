export interface Note {
  id: string;
  title: string;
  content: string;
  personal: boolean;
  creator: string;
  category: string[];
  created: Date;
  updated: Date;
  rank: Number;
}
