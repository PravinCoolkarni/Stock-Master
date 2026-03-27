import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, duration = 3000): void {
    this.open(message, {
      duration,
      panelClass: 'snack-success'
    });
  }

  error(message: string, duration = 4000): void {
    this.open(message, {
      duration,
      panelClass: 'snack-error'
    });
  }

  info(message: string, duration = 3000): void {
    this.open(message, { duration });
  }

  open(message: string, config: MatSnackBarConfig = {}): void {
    this.snackBar.open(message, '', {
      verticalPosition: 'top',
      horizontalPosition: 'center',
      ...config
    });
  }
}
