import { LightningElement, api } from 'lwc';

export default class PicklistDatatable extends LightningElement {
    @api value;
    @api placeholder;
    @api options;
    @api context;

    handleChange(event) {
        const selectedValue = event.detail.value;
        const changeEvent = new CustomEvent('change', {
            detail: { value: selectedValue, context: this.context }
        });
        this.dispatchEvent(changeEvent);
    }
}



