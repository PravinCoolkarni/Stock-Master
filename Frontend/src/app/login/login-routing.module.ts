import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { GoogleCallbackComponent } from './google-callback/google-callback.component';
import { RegisterComponent } from './register/register.component';
import { guestGuard } from 'src/middleware/Auth.guard';

const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginComponent
  },
  {
    path: 'google/callback',
    component: GoogleCallbackComponent
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    component: RegisterComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
