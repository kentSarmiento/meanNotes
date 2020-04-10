import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";

import { AuthService } from "../auth.service";

@Component({
  templateUrl: "./signup.component.html",
  styleUrls: [ "../common/auth-common.css" ]
})
export class SignupComponent {
  isLoading = false;
  hide=true;

  constructor(private authService: AuthService) {}

  onSignup(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService.signup(form.value.username, form.value.email, form.value.password);
    form.resetForm();
  }
}