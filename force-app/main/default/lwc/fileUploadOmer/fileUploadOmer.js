import { LightningElement, wire, api, track } from 'lwc';
import getTypePicklistValues from '@salesforce/apex/fileUploadController.getTypePicklistValues';
import getFilesForRecord from '@salesforce/apex/fileUploadController.getFilesForRecord';
import updateFileType from '@salesforce/apex/fileUploadController.updateFileType';
import { refreshApex } from '@salesforce/apex';

export default class FileUploadOmer extends LightningElement {
    @api recordId;
    @track files = [];
    @track picklistValues = [];
    @track error;

    acceptedFormats = '.pdf, .jpg, .png, .docx, .xlsx'; // Adjust as needed
    wiredFilesResult;

    @wire(getFilesForRecord, { recordId: '$recordId' })
    wiredFiles(result) {
        this.wiredFilesResult = result;
        const { data, error } = result;
        if (data) {
            this.files = data.map(file => ({
                ...file,
                FileUrl: `/lightning/r/ContentDocument/${file.ContentDocumentId}/view` // URL to view the Content Document record
            }));
            this.error = undefined;
            } else if (error) {
            this.error = error;
            this.files = [];
        }
    }

    @wire(getTypePicklistValues)
    wiredPicklistValues({ data, error }) {
        if (data) {
            this.picklistValues = data.map(value => ({
                label: value,
                value: value
            }));
        } else if (error) {
            console.error('Error fetching picklist values:', error);
        }
    }

    handleUploadFinished() {
        // Refresh the files list after upload
        return refreshApex(this.wiredFilesResult);
    }

    updateFileType(contentVersionId, type) {
        updateFileType({ contentVersionId, type })
            .then(() => {
                this.dispatchEvent(new CustomEvent('success', { detail: { message: 'File type updated successfully.' } }));
                this.handleUploadFinished(); // Refresh after update
            })
            .catch(error => {
                console.error('Error updating file type:', error);
            });
    }

    handleRowAction(event) {
        // Handle row action if needed
    }

    get columns() {
        return [
            {
                label: 'File Name',
                fieldName: 'FileUrl',
                type: 'url',
                typeAttributes: {
                    label: { fieldName: 'Title' },
                    target: '_self' // Opens in the same tab
                }
            },
            {
                label: 'Custom Type',
                fieldName: 'Type__c',
                type: 'picklist',
                editable: true,
                typeAttributes: {
                    placeholder: 'Choose Type',
                    options: this.picklistValues,
                    value: { fieldName: 'Type__c' },
                    context: { fieldName: 'Id' }
                }
            },
            { label: 'Size (bytes)', fieldName: 'ContentSize', type: 'number' }
        ];
    }
}
