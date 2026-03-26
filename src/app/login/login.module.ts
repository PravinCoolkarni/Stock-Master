import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { MaterialModule } from '../../material/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register/register.component';
import { LoginRoutingModule } from './login-routing.module';
import { GoogleCallbackComponent } from './google-callback/google-callback.component';



@NgModule({
  declarations: [LoginComponent, RegisterComponent, GoogleCallbackComponent],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    LoginRoutingModule,
  ],
  exports: [
    LoginComponent
  ]

})
export class LoginModule { }
