import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import { Router } from "@angular/router";

import { AuthInfo } from "./authinfo.model";

@Injectable({ providedIn: "root" })
export class AuthService {
  private token: string;
  private isAuthenticated = false;
  private userId: string;
  private tokenTimer: any;
  private authStatusListener = new Subject<boolean>();

  constructor(private http: HttpClient, private router: Router) {}

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  signup(username: string, email: string, password: string) {
    const signupInfo = {
      username: username,
      email: email,
      password: password
    };
    console.log(signupInfo);
    this.http
      .post(
        "http://localhost:3000/users/signup",
        signupInfo
      )
      .subscribe(response => {
        this.login(username, password); // Login user immediately after signup
      });
  }

  login(username: string, password: string) {
    const authInfo: AuthInfo = {
      username: username,
      password: password
    };
    this.http
      .post<{ token: string; expiresIn: number; userId: string}>(
        "http://localhost:3000/users/login",
        authInfo
      )
      .subscribe(response => {
        const token = response.token;
        this.token = token;
        if (token) {
          const expiresInDuration = response.expiresIn;
          this.setAuthTimer(expiresInDuration);
          this.isAuthenticated = true;
          this.userId = response.userId;
          this.authStatusListener.next(true);

          const now = new Date();
          const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
          this.saveAuthData(this.token, expirationDate, this.userId);
          this.router.navigate(["/"]);
        }
      });
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.userId = null;
    this.authStatusListener.next(false);
    this.clearAuthData();
    this.resetAuthTimer();
    this.router.navigate(["/"]);
  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private resetAuthTimer() {
    clearTimeout(this.tokenTimer);
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("expiration", expirationDate.toISOString());
    localStorage.setItem("userId", userId);
  }

  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userId");
  }
}