import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";

@Component({
  templateUrl: "./signup.component.html",
  styleUrls: [ "./signup.component.css" ]
})
export class SignupComponent {
  hide=true;

  onSignup(form: NgForm) {
    if (form.invalid) {
      return;
    }
    form.resetForm();
  }
}