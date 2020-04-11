import {
  CanActivate, ActivatedRouteSnapshot,
  RouterStateSnapshot, Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isUserAuthenticated = this.authService.getIsAuthenticated();
    if (!isUserAuthenticated) {
      this.router.navigate(['/auth/login']);
    }
    return isUserAuthenticated;
  }
}