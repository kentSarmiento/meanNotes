export interface Todo {
  id: string;
  localUpdate: boolean;

  _id: string;
  creator: string;
  list: string;
  title: string;
  finished: boolean;
  rank: number;
  updated: Date;
  version: number;
  locked: boolean;
  personal: boolean;
}

export interface List {
  localUpdate: boolean;

  _id: string;
  creator: string;
  title: string;
  rank: number;
  updated: Date;
  version: number;
  locked: boolean;
  personal: boolean;
}