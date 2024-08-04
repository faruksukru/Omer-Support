import  LightningDatatable from 'lightning/datatable';
import picklistColumn from './picklistColumn.html';
import pickliststatic from './pickliststatic.html'
export default class customTypesGlobal extends LightningDatatable {
    static customTypes = {
        picklistColumn: {
            template: pickliststatic,
            editTemplate: picklistColumn,
            standardCellLayout: true,
            typeAttributes: ['label', 'options', 'value', 'context', 'placeholder', 'variant','name']
        }
    };
      
}