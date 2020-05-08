import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class ResponsiveService {
  private viewUpdated = new Subject<boolean>();
  private isMobile: boolean;

  constructor() {
    this.isMobile = false;
    this.checkWidth();
  }

  getViewUpdatedListener() {
    return this.viewUpdated.asObservable();
  }

  notifyUpdatedView() {
    this.viewUpdated.next(this.isMobile);
  }

  public checkWidth() {
    let width = window.innerWidth;

    if (width <= 768 && !this.isMobile) {
      this.isMobile = true;
      this.notifyUpdatedView();
    } else if (width > 768 && this.isMobile) {
      this.isMobile = false;
      this.notifyUpdatedView();
    }

    return this.isMobile;
  }
}