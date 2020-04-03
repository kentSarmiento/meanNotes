import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Subject } from 'rxjs';

import { NoteCategory } from './note-category.model';

@Injectable({providedIn: "root"})
export class NoteCategoryService {
  private categories: NoteCategory[] = [];
  private categoryUpdated = new Subject<NoteCategory[]>(); 

  constructor(private http: HttpClient) {}

  getCategories() {
    this.http
      .get<any>(
          "http://localhost:3000/categories"
      )
      .subscribe((data: NoteCategory[]) => {
        this.categories = data;
        this.categoryUpdated.next([...this.categories]);
      });
  }

  getCategoryUpdatedListener() {
    return this.categoryUpdated.asObservable();
  }

  addCategory(name: string) {
    const category: NoteCategory = { name: name, };
    this.http
      .post<any>(
          "http://localhost:3000/categories", category
      )
      .subscribe(() => {
        this.categories.push(category);
        this.categoryUpdated.next([...this.categories]);
      });
  }
}