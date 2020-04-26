export interface Todo {
  id: string;
  title: string;
  finished: boolean;
  list: string;
  creator: string;
  //note: string;
  //personal: boolean;
  //category: string[];
  //created: Date;
  //updated: Date;
  rank: Number;
}

export interface List {
  id: string;
  title: string;
  creator: string;
  rank: Number;
}