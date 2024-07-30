// JavaScript
import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import getOpportunityInfo from '@salesforce/apex/OpportunityControllerV2.getOpportunityInfo';
import getFilteredAccounts from '@salesforce/apex/OpportunityControllerV2.getAllLenders';
import sendEmail from '@salesforce/apex/OpportunityControllerV2.sendEmail';
import updateOpportunityStage from '@salesforce/apex/OpportunityControllerV2.updateOpportunityStage';
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
    @track accounts = [];
    @track filteredAccounts = [];
    @track error;
    cardTitle = 'Opportunity'; // Default title
    selectedFilter = 'Qualified'; // Default filter value

    columns = COLUMNS;

    // Filter options for the combobox
    filterOptions = [
        { label: 'Qualified', value: 'Qualified' },
        { label: 'Not Qualified', value: 'Not Qualified' },
        { label: 'API Lenders', value: 'API Lenders' },
        { label: 'All', value: 'All' }
    ];

    @wire(CurrentPageReference)
    currentPageReference;

    @wire(getOpportunityInfo, { opportunityId: '$recordId' })
    wiredOpportunity({ error, data }) {
        if (data) {
            this.opportunity = data;
            this.cardTitle = data.Name; // Set the card title to the opportunity name
            this.fetchAccounts(); // Fetch all accounts initially
        } else if (error) {
            this.error = error.body.message;
        }
    }

    connectedCallback() {
        this.recordId = this.currentPageReference.state.c__recordId;
    }

    fetchAccounts() {
        getFilteredAccounts()
            .then(data => {
                this.accounts = data.map(acc => ({
                    ...acc,
                    recordLink: `/lightning/r/Account/${acc.Id}/view`
                }));
                this.applyFilter(); // Apply the default filter
            })
            .catch(error => {
                this.error = error.body.message;
            });
    }

    applyFilter() {
        if (this.selectedFilter === 'All') {
            this.filteredAccounts = this.accounts;
        } else if (this.selectedFilter === 'Qualified') {
            this.filteredAccounts = this.accounts.filter(account => {
                return this.opportunity.Credit_Score__c >= account.Minumum_Credit_Score__c &&
                       this.opportunity.Amount >= account.Minumum_Monthly_Deposit_Amount__c &&
                       !account.Restricted_Industries__c.includes(this.opportunity.Industry);
            });
        } else if (this.selectedFilter === 'Not Qualified') {
            this.filteredAccounts = this.accounts.filter(account => {
                return !(this.opportunity.Credit_Score__c >= account.Minumum_Credit_Score__c &&
                         this.opportunity.Amount >= account.Minumum_Monthly_Deposit_Amount__c &&
                         !account.Restricted_Industries__c.includes(this.opportunity.Industry));
            });
        } /*else if (this.selectedFilter === 'API Lenders') {
            // Assuming 'API Lenders' requires specific filtering; adjust as needed
            this.filteredAccounts = this.accounts.filter(account => {
                // Replace with actual API Lenders filtering logic if needed
                return account.RecordType.DeveloperName === 'API_Lenders';
            });
        }*/ else {
            this.filteredAccounts = [];
        }
    }

    handleFilterChange(event) {
        this.selectedFilter = event.detail.value;
        this.applyFilter(); // Apply the filter when changed
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
        updateOpportunityStage({ opportunityId: this.recordId, newStage: 'Underwriting' })
            .then(() => {
                this.showToast('Success', 'Opportunity stage updated to Underwriting', 'success');
                return sendEmail({ opportunityId: this.recordId });
            })
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
