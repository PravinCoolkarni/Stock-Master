export class ResearchRequest {
    sourceType: string | number;
    urls: string[];
    docs?: Document;
    rawText: string;
    context: string;

    constructor() {
        this.sourceType = '';
        this.urls = [];
        this.rawText = '';
        this.context = '';
    }
}

export class  Document{
    docName: string;
    docData: string;
    docType: string;

    constructor() {
        this.docName = '';
        this.docData = '';
        this.docType = '';
    }
}
