import { LightningDatatable } from 'lightning/datatable';
import picklistDatatable from 'c/picklistDatatable';

LightningDatatable.types.customPicklist = {
    template: picklistDatatable,
    standardCellLayout: true,
    typeAttributes: ['placeholder', 'options', 'value', 'context']
};
