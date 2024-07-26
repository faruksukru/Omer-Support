import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import getOpportunityInfo from '@salesforce/apex/OpportunityController.getOpportunityInfo';
import sendEmail from '@salesforce/apex/OpportunityController.sendEmail';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OpportunityInfo extends NavigationMixin(LightningElement) {
    @api recordId;
    @track opportunity;
    @track error;
    cardTitle = 'Opportunity'; // Default title


    @wire(CurrentPageReference)
    currentPageReference;

    @wire(getOpportunityInfo, { opportunityId: '$recordId' })
    wiredOpportunity({ error, data }) {
        if (data) {
            this.opportunity = data;
            this.cardTitle = data.Name; // Set the card title to the opportunity name
        } else if (error) {
            this.error = error.body.message;
        }
    }

    connectedCallback() {
        this.recordId = this.currentPageReference.state.c__recordId;
    }

    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
    }

    handleSubmit() {
        sendEmail({ opportunityId: this.recordId })
            .then(() => {
                this.showToast('Success', 'Email sent successfully', 'success');
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}
