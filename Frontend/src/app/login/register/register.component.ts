import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/services/authetication.service';
import { SnackbarService } from 'src/services/snackbar.service';
import { trigger, style, animate, transition, stagger, query } from '@angular/animations';

function passwordMatchValidator(control: AbstractControl) {
  const pass    = control.get('password');
  const confirm = control.get('confirmPassword');
  if (pass && confirm && pass.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
  } else {
    confirm?.setErrors(null);
  }
  return null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        query('.anim-item', [
          style({ opacity: 0, transform: 'translateY(24px)' }),
          stagger(70, [animate('480ms cubic-bezier(0.35,0,0.25,1)',
            style({ opacity: 1, transform: 'translateY(0)' }))])
        ], { optional: true })
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading  = false;
  hidePass = true;
  hideConf = true;
  errorMsg = '';
 
  // Password strength
  get strength(): number {
    const v = this.form?.get('password')?.value || '';
    let s = 0;
    if (v.length >= 8)            s++;
    if (/[A-Z]/.test(v))          s++;
    if (/[0-9]/.test(v))          s++;
    if (/[^A-Za-z0-9]/.test(v))   s++;
    return s;
  }
 
  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.strength];
  }
 
  get strengthClass(): string {
    return ['', 'weak', 'fair', 'good', 'strong'][this.strength];
  }
 
  constructor(
    private fb: FormBuilder,
    private auth: AuthenticationService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}
 
  ngOnInit(): void {
    this.form = this.fb.group({
      full_name:       ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }
 
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading  = true;
    this.errorMsg = '';
 
    const { full_name, email, password } = this.form.value;
    this.auth.register({ full_name, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.snackbar.success('Account created! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: err => {
        this.loading  = false;
        this.errorMsg = err?.error?.detail || 'Registration failed.';
      }
    });
  }
 
  loginWithGoogle(): void { this.auth.loginWithGoogle(); }
 
  get fullName()        { return this.form.get('full_name')!; }
  get email()           { return this.form.get('email')!; }
  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }
}
