import { LightningElement, wire, api, track } from 'lwc';
import getTypePicklistValues from '@salesforce/apex/fileUploadControllerOld.getTypePicklistValues';
import getFilesForRecord from '@salesforce/apex/fileUploadControllerOld.getFilesForRecord';
import updateFileType from '@salesforce/apex/fileUploadControllerOld.updateFileType';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class FileUploadOmer extends LightningElement {
    @api recordId;
    @track files = [];
    @track picklistValues = [];
    @track error;
    draftValues = [];

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
        this.showToast('Success', 'File uploaded successfully', 'success');
        return refreshApex(this.wiredFilesResult);
    }

    handleSave(event) {
                const updatedFields = event.detail.draftValues.slice().map(draft => {
                    const fields = Object.assign({}, draft);
                    return fields;
                });
        
                const promises = updatedFields.map(record => {
                    console.log("record"+record.Type__c);
                    console.log("record.Id:  "+record.Id);
                    return updateFileType({ contentVersionId: record.Id, type: record.Type__c });
                });
        
                Promise.all(promises)
                    .then(() => {
                        this.showToast('Success', 'File types updated successfullyyyy', 'success');
                        this.draftValues = [];
                        return refreshApex(this.wiredFilesResult);
                     })
                    .catch(error => {
                        this.showToast('Error', error.body.message, 'error');
                    });
            }     
            
            showToast(title, message, variant) {
                const event = new ShowToastEvent({
                    title: title,
                    message: message,
                    variant: variant
                });
                this.dispatchEvent(event);
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
                    target: '_blank' // Opens in the new tab
                }
            },
            {
                label: 'Type',
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
