import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import getOpportunityInfo from '@salesforce/apex/OpportunityControllerV2.getOpportunityInfo';
import getFilteredAccounts from '@salesforce/apex/OpportunityControllerV2.getAllLenders';
import sendEmail from '@salesforce/apex/OpportunityControllerV2.sendEmail';
import updateOpportunityStage from '@salesforce/apex/OpportunityControllerV2.updateOpportunityStage';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const COLUMNS = [
    { label: 'Name', fieldName: 'recordLink', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_self' } },
    { label: 'Minumum Credit Score',  fieldName: 'Minumum_Credit_Score__c', type: 'number' },
    { label: 'Minumum Monthly Deposit Amount', fieldName: 'Minumum_Monthly_Deposit_Amount__c', type: 'currency' },
    { label: 'Restricted Industries', wrapText:true, fieldName: 'Restricted_Industries__c', type: 'text' },
    { label: 'Column 1', fieldName: 'col1', type: 'text' },
    { label: 'Column 2', fieldName: 'col2', type: 'text' },
    { label: 'Column 3', fieldName: 'col3', type: 'text' },
    { label: 'Column 4', fieldName: 'col4', type: 'text' },
    { label: 'Column 5', fieldName: 'col5', type: 'text' },
    { label: 'Column 6', fieldName: 'col6', type: 'text' },
    {
        label: 'Submission Notes',
        fieldName: 'submissionNotes',
        type: 'text',
        editable: true
    }
];

export default class OpportunityInfo extends NavigationMixin(LightningElement) {
    @api recordId;
    @track opportunity;
    @track accounts = [];
    @track filteredAccounts = [];
    @track error;
    @track draftValues = [];
    @track selectedAccounts = [];
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
                    recordLink: `/lightning/r/Account/${acc.Id}/view`,
                    submissionNotes: '', // Initialize submissionNotes
                    isSelected: false // Initialize checkbox state
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

    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedAccounts = selectedRows.map(row => row.Id);
        console.log("selected"+this.selectedAccounts);
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
                this.error = error.body.message;
                this.showToast('Error', this.error, 'error');
            });
    }

    handleCellChange(event) {
        const draftValues = event.detail.draftValues;
        // Handle saving draft values if needed
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
            })
        );
    }
}
