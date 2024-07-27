import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import getOpportunityInfo from '@salesforce/apex/OpportunityControllerV2.getOpportunityInfo';
import getFilteredAccounts from '@salesforce/apex/OpportunityControllerV2.getFilteredAccounts';
import sendEmail from '@salesforce/apex/OpportunityControllerV2.sendEmail';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const COLUMNS = [
    { label: 'Name', fieldName: 'recordLink', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_self' } },
    { label: 'Minumum Credit Score', fieldName: 'Minumum_Credit_Score__c', type: 'number' },
    { label: 'Minumum Monthly Deposit Amount', fieldName: 'Minumum_Monthly_Deposit_Amount__c', type: 'currency' },
    { label: 'Restricted Industries', fieldName: 'Restricted_Industries__c', type: 'text' }
];

export default class OpportunityInfo extends NavigationMixin(LightningElement) {
    @api recordId;
    @track opportunity;
    @track accounts;
    @track error;
    cardTitle = 'Opportunity'; // Default title

    columns = COLUMNS;

    @wire(CurrentPageReference)
    currentPageReference;

    @wire(getOpportunityInfo, { opportunityId: '$recordId' })
    wiredOpportunity({ error, data }) {
        if (data) {
            this.opportunity = data;
            this.cardTitle = data.Name; // Set the card title to the opportunity name

            // Fetch accounts based on credit score
            this.fetchAccounts(data.Credit_Score__c);
        } else if (error) {
            this.error = error.body.message;
        }
    }

    connectedCallback() {
        this.recordId = this.currentPageReference.state.c__recordId;
    }

    fetchAccounts(creditScore) {
        getFilteredAccounts({ creditScore })
            .then(data => {
                // Add a URL field for account links
                this.accounts = data.map(acc => ({
                    ...acc,
                    recordLink: `/lightning/r/Account/${acc.Id}/view`
                }));
            })
            .catch(error => {
                this.error = error.body.message;
            });
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
