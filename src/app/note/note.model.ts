export interface Note {
  id: string;

  _id: string;
  creator: string;
  book: string;
  title: string;
  content: string;
  rank: number;
  created: Date;
  updated: Date;
  version: number;
  locked: boolean;
  personal: boolean;
}

export interface Book {
  _id: string;
  creator: string;
  title: string;
  rank: number;
  updated: Date;
  version: number;
  locked: boolean;
  personal: boolean;
}