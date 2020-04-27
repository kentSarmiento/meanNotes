import { Component, OnInit, OnDestroy } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Subscription } from "rxjs";
import { Router, ActivatedRoute } from "@angular/router";

import { AuthService } from "../auth.service";

@Component({
  templateUrl: "./login.component.html",
  styleUrls: [ "../common/auth-common.css" ]
})
export class LoginComponent implements OnInit, OnDestroy {
  private authStatusSub: Subscription;
  isLoading = false;

  private returnUrl = "/";

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.authStatusSub = this.authService.getAuthStatusListener()
      .subscribe(authStatus => {
        this.isLoading = false;
      });

    this.activatedRoute.queryParams
      .subscribe(params => {
        if (params.redirectUrl) this.returnUrl = params.redirectUrl;
      });
  }

  onLogin(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService.login(
      form.value.username,
      form.value.password,
      () => {
        this.router.navigate([this.returnUrl]);
      });
    form.resetForm();
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}