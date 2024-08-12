import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import getOpportunityInfo from '@salesforce/apex/OpportunityControllerV2.getOpportunityInfo';
import getFilteredAccounts from '@salesforce/apex/OpportunityControllerV2.getAllLenders';
import sendEmail from '@salesforce/apex/OpportunityControllerV2.sendEmail';
import updateOpportunityStage from '@salesforce/apex/OpportunityControllerV2.updateOpportunityStage';
import createSubmissions from '@salesforce/apex/OpportunityControllerV2.createSubmissions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import{IsConsoleNavigation, refreshTab, getFocusedTabInfo} from 'lightning/platformWorkspaceApi'
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [
    { label: 'Name', fieldName: 'recordLink', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_self' } },
    { label: 'Minimum Credit Score', fieldName: 'Minumum_Credit_Score__c', type: 'number' },
    { label: 'Minimum Monthly Deposit Amount', fieldName: 'Minumum_Monthly_Deposit_Amount__c', type: 'currency' },
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
    @track hideCheckboxColumn = false; // Initially hide checkboxes
    //@track selectedFiles =[];

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

    @wire(IsConsoleNavigation)
    isConsoleApp

    async refreshTabHandler(){
        if(this.isConsoleApp){
            const {tabId} = await getFocusedTabInfo()
            await refreshTab(tabId, {
                includeAllSubtabs:true
            })
        }
    }


    connectedCallback() {
        // Extract the recordId from URL parameters
        if (this.currentPageReference && this.currentPageReference.state) {
            this.recordId = this.currentPageReference.state.c__recordId;
        }

        // Fetch the opportunity info when the component is initialized
        this.fetchOpportunityInfo();
        this.refreshComponent();
    }

    fetchOpportunityInfo() {
        getOpportunityInfo({ opportunityId: this.recordId })
            .then(data => {
                this.opportunity = data;
                this.cardTitle = data.Name; // Set the card title to the opportunity name
                this.fetchAccounts(); // Fetch all accounts initially
            })
            .catch(error => {
                this.error = error.body.message;
            });
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
            this.hideCheckboxColumn = true; // Show checkboxes
        } else if (this.selectedFilter === 'Qualified') {
            this.hideCheckboxColumn = false;
            this.filteredAccounts = this.accounts.filter(account => {
                return this.opportunity.Credit_Score__c >= account.Minumum_Credit_Score__c &&
                       this.opportunity.Amount >= account.Minumum_Monthly_Deposit_Amount__c &&
                       !account.Restricted_Industries__c.includes(this.opportunity.Industry);
            });
        } else if (this.selectedFilter === 'Not Qualified') {
            this.hideCheckboxColumn = true; // Show checkboxes
            this.filteredAccounts = this.accounts.filter(account => {
                return !(this.opportunity.Credit_Score__c >= account.Minumum_Credit_Score__c &&
                         this.opportunity.Amount >= account.Minumum_Monthly_Deposit_Amount__c &&
                         !account.Restricted_Industries__c.includes(this.opportunity.Industry));
            });
        } else {
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
        console.log("selected" + this.selectedAccounts);
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
        const childComponent = this.template.querySelector('c-file-upload-omer-v3');
        if (childComponent) {
            // Get data from the child component
            this.arrayData = childComponent.getArrayData();
            console.log('comes from child' + this.arrayData[0]);
        }
        if (this.arrayData.length === 0) {
            this.showToast('Error', 'Please select at least one File!', 'error');
        } else if (this.selectedAccounts.length === 0) {
            this.showToast('Error', 'Please select at least one Lender!', 'error');
        } else{
        updateOpportunityStage({ opportunityId: this.recordId, newStage: 'Underwriting' })
            .then(() => {
                this.showToast('Success', 'Opportunity stage updated to Underwriting', 'success');
                return sendEmail({ opportunityId: this.recordId, contentVersionIds: this.arrayData, selectedAccountIds: this.selectedAccounts });
            })
            .then(() => {
                this.showToast('Success', 'Email sent successfully', 'success');
            })
            .then(() => {
                return createSubmissions({ opportunityId: this.recordId, selectedAccountIds: this.selectedAccounts });
            })
            .then(() => {
                this.showToast('Success', 'Submissions created successfully', 'success');
            })
            .catch(error => {
                this.error = error.body.message;
                this.showToast('Error', this.error, 'error');
            });
        }
    }

    handleCellChange(event) {
        const draftValues = event.detail.draftValues;
        // Handle saving draft values if needed
    }

    refreshComponent() {
        this.fetchOpportunityInfo(); // Imperatively fetch the opportunity info again
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