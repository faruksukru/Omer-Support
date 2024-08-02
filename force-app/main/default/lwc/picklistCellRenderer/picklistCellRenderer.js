import { LightningElement, api } from 'lwc';

export default class PicklistCellRenderer extends LightningElement {
    @api options;
    @api value;

    handleChange(event) {
        const newValue = event.detail.value;
        this.dispatchEvent(new CustomEvent('picklistchange', {
            detail: {
                value: newValue,
                context: this.context
            }
        }));
    }
}
