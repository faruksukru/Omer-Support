import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class OpportunityButton extends NavigationMixin(LightningElement) {
    @api recordId;

    handleButtonClick() {
        // Navigate to the Lightning page
       
            this[NavigationMixin.Navigate]({
                type: 'standard__navItemPage',
                attributes: {
                    apiName: 'Test_Omer_Page' // The API name of your Lightning page
                },
                state: {
                    c__recordId: this.recordId, // Passing the recordId
                    c__t: new Date().getTime() // Adding timestamp to prevent caching
                }
        }).then(() => {
            // This refreshData method should be part of the component that needs refreshing
            const lwcComponent = this.template.querySelector('c-test-omer-l-w-c-v2');
            if (lwcComponent) {
                lwcComponent.refreshData();
            }
        });
    }
}
