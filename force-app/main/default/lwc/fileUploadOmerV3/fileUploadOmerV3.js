import { LightningElement, track, wire, api } from 'lwc';
import fetchFiles from '@salesforce/apex/fileUploadController.getFilesForRecord';
import CONTENT_VERSION_OBJECT from '@salesforce/schema/ContentVersion';
import TYPE_FIELD from '@salesforce/schema/ContentVersion.Type__c';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
const columns =[
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
        type: 'picklistColumn', // Use the custom data type here
        editable: true, wrapText:true,
        typeAttributes: {
            placeholder: 'Choose Type',
            options: { fieldName: 'pickListOptions' },
            value: { fieldName: 'Type_c' },
            context: { fieldName: 'Id' }
        }
    },
    { label: 'Size (bytes)', fieldName: 'ContentSize', type: 'number' }
]
 
export default class fileUploadOmerV3 extends LightningElement {
    columns = columns;
    @api recordId;
    showSpinner = false;
    @track data = [];
    @track dataURL = [];
    @track filesData;
    @track draftValues = [];
    lastSavedData = [];
    @track pickListOptions;
    wiredFilesResult;

 
    @wire(getObjectInfo, { objectApiName: CONTENT_VERSION_OBJECT })
    objectInfo;
 
    //fetch picklist options
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: TYPE_FIELD
    })
 
    wirePickList({ error, data }) {
        if (data) {
            this.pickListOptions = data.values;
            console.log('PLS'+this.pickListOptions[1].value)
        } else if (error) {
            console.log(error);
        }
    }
    //here I pass picklist option so that this wire method call after above method, and add URL
    @wire(fetchFiles, {recordId: '$recordId',pickList: '$pickListOptions' })
    filesData(result) {
        this.filesData = result;
        if (result.data) {
            this.dataURL=[];
            this.dataURL = result.data.map(file => ({
                ...file,
                FileUrl: `/lightning/r/ContentDocument/${file.ContentDocumentId}/view` // URL to view the Content Document record
            }));
            console.log('id'+this.dataURL[0].FileUrl);
            this.data = JSON.parse(JSON.stringify(this.dataURL));
            this.data.forEach(ele => {
                ele.pickListOptions = this.pickListOptions;
          })
 
            this.lastSavedData = JSON.parse(JSON.stringify(this.data));
            
        } else if (result.error) {
            this.data = undefined;
        }
    };
 
    updateDataValues(updateItem) {
        let copyData = JSON.parse(JSON.stringify(this.data));
 
        copyData.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
            }
        });
 
        //write changes back to original data
        this.data = [...copyData];
    }
 
    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = [...this.draftValues];
        //store changed value to do operations
        //on save. This will enable inline editing &
        //show standard cancel & save button
        copyDraftValues.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });
 
        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
    }
 
    //handler to handle cell changes & update values in draft values
    handleCellChange(event) {
        //this.updateDraftValues(event.detail.draftValues[0]);
        let draftValues = event.detail.draftValues;
        draftValues.forEach(ele=>{
            this.updateDraftValues(ele);
        })
    }

    handleUploadFinished() {
        this.showToast('Success', 'File uploaded successfully', 'success');
        return refreshApex(this.filesData);
    }
 
    handleSave(event) {
        this.showSpinner = true;
        this.saveDraftValues = this.draftValues;
 
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
 
        // Updating the records using the UiRecordAPi
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.showToast('Success', 'Records Updated Successfully!', 'success', 'dismissable');
            this.draftValues = [];
            return this.refresh();
        }).catch(error => {
            console.log(error);
            this.showToast('Error', 'An Error Occured!!', 'error', 'dismissable');
        }).finally(() => {
            this.draftValues = [];
            this.showSpinner = false;
        });
    }
 
    handleCancel(event) {
        //remove draftValues & revert data changes
        this.data = JSON.parse(JSON.stringify(this.lastSavedData));
        this.draftValues = [];
    }
 
    showToast(title, message, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }
 
    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.filesData);
    }

    
}