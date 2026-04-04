import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {
  ResearchService,
} from 'src/services/research.service';
import {
  ResearchChatMessage,
  ResearchChatSession,
  ResearchContextResponse,
  ResearchQuestionResponse,
} from 'src/interfaces/ResearchChat';
import { Document, ResearchRequest } from 'src/models/ResearchRequest';
import { ContentType } from 'src/enums/contentType';
import { SnackbarService } from 'src/services/snackbar.service';
import { ContentPopupComponent } from './content-popup/content-popup.component';

@Component({
  selector: 'app-market-research',
  templateUrl: './market-research.component.html',
  styleUrls: ['./market-research.component.scss']
})
export class MarketResearchComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('questionFormDirective') questionFormDirective?: FormGroupDirective;
  @ViewChild('messageList') messageList?: ElementRef<HTMLDivElement>;

  dataSourceForm: FormGroup;
  questionForm: FormGroup;
  type: ContentType = ContentType.URL;
  subscription: Subscription = new Subscription();
  loading = false;
  isSubmittingQuestion = false;
  isDragging = false;
  sessions: ResearchChatSession[] = [];
  messages: ResearchChatMessage[] = [];
  activeSession: ResearchChatSession | null = null;
  isCreatingNewChat = true;
  isMobileSessionMenuOpen = false;
  readonly ContentType = ContentType;

  constructor(
    private fb: FormBuilder,
    private researchService: ResearchService,
    private snackbar: SnackbarService,
    private dialog: MatDialog
  ) {
    this.dataSourceForm = this.fb.group({
      sourceType: [ContentType.URL, Validators.required],
      urls: this.fb.array([this.createUrlFormControl()]),
      docs: this.fb.group({
        file: [null],
        docType: ['']
      }),
      rawText: ['']
    });

    this.questionForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.subscription.add(
      this.dataSourceForm.get('sourceType')?.valueChanges.subscribe(sourceType => {
        this.type = sourceType;
        this.updateValidatorsAndControls(sourceType);
      })
    );

    this.updateValidatorsAndControls(ContentType.URL);
    this.loadSessions();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get urls(): FormArray {
    return this.dataSourceForm.get('urls') as FormArray;
  }

  get questionControl(): FormControl {
    return this.questionForm.get('content') as FormControl;
  }

  createUrlFormControl(): FormControl {
    return this.fb.control('', [Validators.required, this.urlValidator]);
  }

  updateValidatorsAndControls(sourceType: ContentType): void {
    const urlsArray = this.urls;
    const docsGroup = this.dataSourceForm.get('docs') as FormGroup;
    const rawTextControl = this.dataSourceForm.get('rawText');

    urlsArray.controls.forEach(control => control.clearValidators());
    docsGroup.get('docType')?.clearValidators();
    docsGroup.get('file')?.clearValidators();
    rawTextControl?.clearValidators();

    if (sourceType === ContentType.URL) {
      urlsArray.enable();
      urlsArray.controls.forEach(control => control.setValidators([Validators.required, this.urlValidator]));
      docsGroup.disable();
      rawTextControl?.disable();
    } else if (sourceType === ContentType.Docs) {
      urlsArray.disable();
      docsGroup.enable();
      docsGroup.get('docType')?.setValidators(Validators.required);
      docsGroup.get('file')?.setValidators(Validators.required);
      rawTextControl?.disable();
    } else if (sourceType === ContentType.RawText) {
      urlsArray.disable();
      docsGroup.disable();
      rawTextControl?.enable();
      rawTextControl?.setValidators([Validators.required, Validators.minLength(10)]);
    }

    urlsArray.updateValueAndValidity();
    docsGroup.updateValueAndValidity();
    rawTextControl?.updateValueAndValidity();
  }

  loadSessions(sessionToSelectId?: string): void {
    this.researchService.listSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;

        if (sessionToSelectId) {
          const matchingSession = sessions.find(session => session.id === sessionToSelectId);
          if (matchingSession) {
            this.selectSession(matchingSession);
            return;
          }
        }

        if (this.activeSession) {
          const refreshedSession = sessions.find(session => session.id === this.activeSession?.id);
          if (refreshedSession) {
            this.activeSession = refreshedSession;
            return;
          }
        }

        if (!sessions.length) {
          this.startNewChat();
        }
      },
      error: () => {
        this.snackbar.error('Unable to load research sessions.');
      }
    });
  }

  loadSessionDetail(sessionId: string): void {
    this.loading = true;
    this.researchService.getSessionDetail(sessionId).subscribe({
      next: detail => {
        this.activeSession = detail.session;
        this.messages = detail.messages;
        this.isCreatingNewChat = false;
        this.loading = false;
        this.scrollMessagesToBottom();
      },
      error: () => {
        this.loading = false;
        this.snackbar.error('Unable to load this research session.');
      }
    });
  }

  selectSession(session: ResearchChatSession): void {
    this.questionFormDirective?.resetForm({ content: '' });
    this.questionForm.reset({ content: '' });
    this.closeMobileSessionMenu();
    this.loadSessionDetail(session.id);
  }

  startNewChat(): void {
    this.isCreatingNewChat = true;
    this.activeSession = null;
    this.messages = [];
    this.questionFormDirective?.resetForm({ content: '' });
    this.questionForm.reset({ content: '' });
    this.closeMobileSessionMenu();
    this.resetSourceForm();
  }

  toggleMobileSessionMenu(): void {
    this.isMobileSessionMenuOpen = !this.isMobileSessionMenuOpen;
  }

  closeMobileSessionMenu(): void {
    this.isMobileSessionMenuOpen = false;
  }

  resetSourceForm(): void {
    while (this.urls.length > 1) {
      this.urls.removeAt(this.urls.length - 1);
    }
    this.urls.at(0).setValue('');
    this.dataSourceForm.reset({
      sourceType: ContentType.URL,
      docs: {
        file: null,
        docType: ''
      },
      rawText: ''
    });
    this.type = ContentType.URL;
    this.updateValidatorsAndControls(ContentType.URL);
    this.removeFile();
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
    return this.urls.length === 0 || this.urls.at(this.urls.length - 1).invalid;
  }

  urlValidator(control: FormControl): { [key: string]: boolean } | null {
    if (!control.value) {
      return null;
    }

    const pattern = new RegExp(
      '^(https?://)?' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
      '((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return pattern.test(control.value) ? null : { invalidUrl: true };
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const fileControl = this.dataSourceForm.get('docs.file');
    const docTypeControl = this.dataSourceForm.get('docs.docType');

    if (!target.files?.length) {
      return;
    }

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
        fileControl?.setErrors({ invalidFileType: true });
        fileControl?.markAsTouched();
        return;
    }

    fileControl?.setValue(file);
    fileControl?.markAsTouched();
    fileControl?.setErrors(null);
    docTypeControl?.setValue(docType);
    docTypeControl?.disable();
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files?.length) {
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

  async submitNewChat(): Promise<void> {
    if (this.dataSourceForm.invalid) {
      this.dataSourceForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      const request = await this.buildResearchRequest();
      this.researchService.getResearchContext(request).subscribe({
        next: response => {
          this.loading = false;
          this.openReviewedContextDialog(request, response);
        },
        error: () => {
          this.loading = false;
          this.snackbar.error('Unable to extract context from the selected source.');
        }
      });
    } catch (error) {
      console.error(error);
      this.loading = false;
      this.snackbar.error('Unable to prepare the selected source.');
    }
  }

  openReviewedContextDialog(request: ResearchRequest, response: ResearchContextResponse): void {
    const extractedContext = response.context?.trim();
    if (!extractedContext) {
      this.snackbar.error('No reviewable context was extracted from the selected source.');
      return;
    }

    const dialogRef = this.dialog.open(ContentPopupComponent, {
      width: 'min(960px, 92vw)',
      maxWidth: '92vw',
      data: extractedContext,
      disableClose: true
    });

    this.subscription.add(
      dialogRef.afterClosed().subscribe(reviewedContext => {
        if (typeof reviewedContext !== 'string') {
          return;
        }

        const trimmedContext = reviewedContext.trim();
        if (!trimmedContext) {
          this.snackbar.error('Reviewed context cannot be empty.');
          return;
        }

        request.context = trimmedContext;
        this.createReviewedSession(request);
      })
    );
  }

  createReviewedSession(request: ResearchRequest): void {
    this.loading = true;
    this.researchService.createSeededSession(request).subscribe({
      next: response => {
        this.loading = false;
        this.snackbar.success('Research session created. You can now ask questions in this chat.');
        this.loadSessions(response.session.id);
      },
      error: () => {
        this.loading = false;
        this.snackbar.error('Unable to create and seed a new research session.');
      }
    });
  }

  async buildResearchRequest(): Promise<ResearchRequest> {
    const formData = this.dataSourceForm.getRawValue();
    const researchRequest = new ResearchRequest();
    researchRequest.sourceType = formData.sourceType;

    switch (formData.sourceType) {
      case ContentType.URL:
        researchRequest.urls = formData.urls || [];
        break;
      case ContentType.Docs: {
        const file = formData.docs.file;
        if (!file) {
          throw new Error('No document selected.');
        }
        const base64 = await this.getBase64(file);
        const base64String = base64 as string;
        researchRequest.docs = new Document();
        researchRequest.docs.docName = file.name;
        researchRequest.docs.docData = base64String.split(',')[1];
        researchRequest.docs.docType = file.name.split('.').pop()?.toLowerCase() || '';
        break;
      }
      case ContentType.RawText:
        researchRequest.rawText = formData.rawText || '';
        break;
      default:
        throw new Error('Unsupported source type.');
    }

    return researchRequest;
  }

  submitQuestion(): void {
    const content = this.questionControl.value?.trim();
    if (!this.activeSession || !content || this.questionControl.invalid) {
      this.questionControl.markAsTouched();
      return;
    }

    this.loading = true;
    this.isSubmittingQuestion = true;
    this.researchService.addQuestion(this.activeSession.id, content).subscribe({
      next: (response: ResearchQuestionResponse) => {
        this.messages = [...this.messages, response.user_message, response.assistant_message];
        this.questionFormDirective?.resetForm({ content: '' });
        this.questionForm.reset({ content: '' });
        if (this.activeSession) {
          this.activeSession = {
            ...this.activeSession,
            message_count: this.activeSession.message_count + 2,
            updated_at: response.assistant_message.created_at
          };
          this.sessions = this.sessions.map(session =>
            session.id === this.activeSession?.id ? this.activeSession! : session
          );
        }
        this.loading = false;
        this.isSubmittingQuestion = false;
        this.scrollMessagesToBottom();
      },
      error: () => {
        this.loading = false;
        this.isSubmittingQuestion = false;
        this.snackbar.error('Unable to process your question for this session.');
      }
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackBySession(_: number, session: ResearchChatSession): string {
    return session.id;
  }

  trackByMessage(_: number, message: ResearchChatMessage): number {
    return message.id;
  }

  formatSessionDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  private scrollMessagesToBottom(): void {
    setTimeout(() => {
      if (!this.messageList?.nativeElement) {
        return;
      }

      const container = this.messageList.nativeElement;
      container.scrollTop = container.scrollHeight;
    });
  }
}
