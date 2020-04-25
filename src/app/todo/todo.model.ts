export interface Todo {
  id: string;
  title: string;
  finished: boolean;
  //note: string;
  //personal: boolean;
  //creator: string;
  //category: string[];
  //created: Date;
  //updated: Date;
  rank: Number;
}

export interface List {
  id: string;
  title: string;
  rank: Number;
}