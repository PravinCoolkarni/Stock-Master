import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-content-popup',
  templateUrl: './content-popup.component.html',
  styleUrls: ['./content-popup.component.scss']
})
export class ContentPopupComponent {
  contextControl: FormControl<string>;

  constructor(
    public dialogRef: MatDialogRef<ContentPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {
    this.contextControl = new FormControl(data ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)]
    });
  }

  onSubmit(): void {
    this.contextControl.markAsTouched();
    if (this.contextControl.invalid) {
      return;
    }

    this.dialogRef.close(this.contextControl.value.trim());
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
