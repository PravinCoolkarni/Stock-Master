import {Component, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-content-popup',
  templateUrl: './content-popup.component.html',
  styleUrls: ['./content-popup.component.scss']
})
export class ContentPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<ContentPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {}

  onSubmit(): void {
    this.dialogRef.close(this.data);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}
