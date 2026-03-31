import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/services/authetication.service';
import { SnackbarService } from 'src/services/snackbar.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  loading   = false;
  hidePass  = true;
  errorMsg  = '';
 
  constructor(
    private fb: FormBuilder,
    private auth: AuthenticationService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}
 
  ngOnInit(): void {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
 
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading  = true;
    this.errorMsg = '';
 
    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.snackbar.success('Welcome back!', 2000);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading  = false;
        this.errorMsg = err?.error?.detail || 'Login failed. Please try again.';
      }
    });
  }
 
  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }
 
  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

}
