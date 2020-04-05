import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";

import { AuthService } from "../auth.service";

@Component({
  templateUrl: "./login.component.html",
  styleUrls: [ "./login.component.css" ]
})
export class LoginComponent {
  hide=true;

  constructor(private authService: AuthService) {}

  onLogin(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.authService.login(form.value.username, form.value.password);
    form.resetForm();
  }
}