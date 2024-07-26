import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Teacher__c.Name';

export default class FileUpload extends LightningElement {
    @api recordId;
    name;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD] })
    wiredRecord({ error, data }) {
        if (data) {
            this.name = data.fields.Name.value;
            console.log('Record ID:', this.recordId);
        } else if (error) {
            console.error('Error retrieving record:', error);
        }
    }

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        console.log('Record ID:', this.recordId);
        console.log('Uploaded Files:', uploadedFiles);
        alert('No. of files uploaded: ' + uploadedFiles.length);
    }
}
