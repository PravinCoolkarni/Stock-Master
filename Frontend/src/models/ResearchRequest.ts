export class ResearchRequest {
    sourceType: string;
    urls: string[];
    docs: Document;
    rawText: string;

    constructor() {
        this.sourceType = '';
        this.urls = [];
        this.docs = new Document();
        this.rawText = '';
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