import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ResearchService } from 'src/services/research.service';
import { ResearchRequest } from 'src/models/ResearchRequest';
import { ContentType } from 'src/enums/contentType';
import { MatDialog } from '@angular/material/dialog';
import { ContentPopupComponent } from './content-popup/content-popup.component';

@Component({
  selector: 'app-market-research',
  templateUrl: './market-research.component.html',
  styleUrls: ['./market-research.component.scss']
})
export class MarketResearchComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  dataSourceForm: FormGroup; // Declared with definite assignment assertion
  type: ContentType = ContentType.URL;
  subscription: Subscription = new Subscription();
  loading = false;
  isDragging = false;
  readonly ContentType = ContentType;

  constructor(
    private fb: FormBuilder,
    private researchService: ResearchService,
    public dialog: MatDialog
  ) {
    this.dataSourceForm = this.fb.group({ // Initialize form in ngOnInit
      sourceType: [ContentType.URL, Validators.required],
      urls: this.fb.array([
        this.createUrlFormControl()
      ]),
      docs: this.fb.group({
        file: [null], // File upload logic is separate for now
        docType: ['']
      }),
      rawText: ['']
    });
  }

  ngOnInit(): void {
    this.subscription.add(this.dataSourceForm.get('sourceType')?.valueChanges.subscribe(sourceType => {
      this.type = sourceType; // Update the type variable for template switching
      this.updateValidatorsAndControls(sourceType);
    }));

    // Set initial state
    this.updateValidatorsAndControls(ContentType.URL);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  updateValidatorsAndControls(sourceType: ContentType): void {
    const urlsArray = this.dataSourceForm.get('urls') as FormArray;
    const docsGroup = this.dataSourceForm.get('docs') as FormGroup;
    const rawTextControl = this.dataSourceForm.get('rawText');

    urlsArray.controls.forEach(control => control.clearValidators());
    docsGroup.get('docType')?.clearValidators();
    docsGroup.get('file')?.clearValidators();
    rawTextControl!.clearValidators();

    if (sourceType === ContentType.URL) {
      urlsArray.enable();
      urlsArray.controls.forEach(control => control.setValidators([Validators.required, this.urlValidator]));
      docsGroup.disable();
      docsGroup.get('docType')?.clearValidators();
      docsGroup.get('file')?.clearValidators();
      rawTextControl!.disable();
      rawTextControl!.clearValidators();
    } else if (sourceType === ContentType.Docs) {
      urlsArray.disable();
      urlsArray.controls.forEach(control => control.clearValidators());
      docsGroup.enable();
      docsGroup.get('docType')?.setValidators(Validators.required);
      docsGroup.get('file')?.setValidators(Validators.required);
      rawTextControl!.disable();
      rawTextControl!.clearValidators();
    } else if (sourceType === ContentType.RawText) {
      urlsArray.disable();
      urlsArray.controls.forEach(control => control.clearValidators());
      docsGroup.disable();
      docsGroup.get('docType')?.clearValidators();
      docsGroup.get('file')?.clearValidators();
      rawTextControl!.enable();
      rawTextControl!.setValidators([Validators.required, Validators.minLength(10)]);
    }

    // Update validity for all controls after changing validators
    urlsArray.updateValueAndValidity();
    docsGroup.updateValueAndValidity();
    rawTextControl!.updateValueAndValidity();
  }

  get urls(): FormArray {
    return this.dataSourceForm.get('urls') as FormArray;
  }

  createUrlFormControl(): FormControl {
    return this.fb.control('', [Validators.required, this.urlValidator]);
  }

  addUrl(): void {
    this.urls.push(this.createUrlFormControl());
  }

  removeUrl(index: number): void {
    if (this.urls.length > 1) {
      this.urls.removeAt(index);
    }
  }

  isAddUrlDisabled(): boolean {
    // Disable adding a new URL if the last one is invalid
    return this.urls.length === 0 || this.urls.at(this.urls.length - 1).invalid;
  }

  urlValidator(control: FormControl): { [key: string]: boolean } | null {
    if (!control.value) {
      return null; // Let `required` validator handle empty values
    }
    // Simple regex for URL validation
    const pattern = new RegExp('^(https?://)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    if (pattern.test(control.value)) {
      return null;
    }
    return { 'invalidUrl': true };
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const fileControl = this.dataSourceForm.get('docs.file');
    const docTypeControl = this.dataSourceForm.get('docs.docType');

    if (target.files && target.files.length) {
      const file = target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? '';
      let docType = '';

      switch (fileExtension) {
        case 'pdf':
          docType = 'pdf';
          break;
        case 'doc':
        case 'docx':
          docType = 'word';
          break;
        case 'xls':
        case 'xlsx':
          docType = 'excel';
          break;
        default:
          this.removeFile();
          fileControl?.setErrors({ 'invalidFileType': true });
          fileControl?.markAsTouched();
          return;
      }

      fileControl?.setValue(file);
      fileControl?.markAsTouched();
      fileControl?.setErrors(null);
      docTypeControl?.setValue(docType);
      docTypeControl?.disable();
    }
  }

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const target = { files } as HTMLInputElement;
      this.onFileSelected({ target } as unknown as Event);
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  removeFile(): void {
    this.dataSourceForm.get('docs.file')?.setValue(null);
    this.dataSourceForm.get('docs.file')?.setErrors(null);
    this.dataSourceForm.get('docs.docType')?.setValue('');
    this.dataSourceForm.get('docs.docType')?.enable();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private getBase64(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  onSubmit(): void {
    this.loading = true;
    if (!this.dataSourceForm.valid) {
      console.log('Form is invalid');
      this.dataSourceForm.markAllAsTouched();
      this.loading = false;
      return;
    }

    const formData = this.dataSourceForm.value;
    const researchRequest = new ResearchRequest();
    researchRequest.sourceType = formData.sourceType;

    switch (formData.sourceType) {
      case ContentType.URL:
        researchRequest.urls = formData.urls || [];
        this.callResearchService(researchRequest);
        break;
      case ContentType.Docs:
        const file = formData.docs.file;
        if (file) {
          this.getBase64(file).then(base64 => {
            const base64String = base64 as string;
            researchRequest.docs.docName = file.name;
            researchRequest.docs.docData = base64String.split(',')[1]; // Remove the data URL prefix
            researchRequest.docs.docType = file.name.split('.').pop()?.toLowerCase() || '';
            this.callResearchService(researchRequest);
          }).catch(error => {
            console.error('Error converting file to Base64:', error);
            this.loading = false;
          });
        }
        break;
      case ContentType.RawText:
        researchRequest.rawText = formData.rawText || '';
        this.callResearchService(researchRequest);
        break;
      default:
        console.error('Invalid source type selected');
        this.loading = false;
        return;
    }
  }

  private callResearchService(researchRequest: ResearchRequest) {
    this.researchService.getResearchContext(researchRequest).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Research data received:', response);
        this.openDialog(response.context.toString());
        // Handle the response as needed
      },
      error: (e) => {
        console.error('Error fetching research data:', e);
        this.loading = false;
      }
    });
  }

  trackByFn(index: any, item: any): number {
    return index;
  }

  openDialog(data: any) {
    const dialogRef = this.dialog.open(ContentPopupComponent, {
      width: '80vw',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: data,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        const params = {
          context: result
        }
        this.researchService.embedContent(params).subscribe({
          next: (response) => {
            this.loading = false;
            alert('Content embedded successfully!');
            console.log('Content embedded successfully:', response);
          }, error: (e) => {
            console.error('Error embedding content:', e);
            this.loading = false;
          }
        });
      }
    });
  }
}
