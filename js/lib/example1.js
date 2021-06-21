//import '../style/galaxyoutput.css';

import { unpack_models } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import  { BaseWidgetModel, BaseWidgetView } from "@genepattern/nbtools";
import $ from "jquery";
//import { extract_file_name, extract_file_type, is_absolute_path, is_url } from '@genepattern/nbtools';
//import { ContextManager } from "@genepattern/nbtools";

export class GalaxyToolModel extends BaseWidgetModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyToolModel.model_name, _model_module: GalaxyToolModel.model_module, _model_module_version: GalaxyToolModel.model_module_version, _view_name: GalaxyToolModel.view_name, _view_module: GalaxyToolModel.view_module, _view_module_version: GalaxyToolModel.view_module_version, name: 'Python Results', description: '', status: '', files: [], text: '', visualization: '', appendix: undefined, extra_file_menu_items: {}, inputs:{} });
    }
}
GalaxyToolModel.model_name = 'TestUIOutputModel';
GalaxyToolModel.model_module = MODULE_NAME;
GalaxyToolModel.model_module_version = MODULE_VERSION;
GalaxyToolModel.view_name = 'TestUIOutputView';
GalaxyToolModel.view_module = MODULE_NAME;
GalaxyToolModel.view_module_version = MODULE_VERSION;
GalaxyToolModel.serializers = Object.assign(Object.assign({}, BaseWidgetModel.serializers), { appendix: {
        deserialize: (value, manager) => unpack_models(value, manager)
    } });

export class GalaxyToolView extends BaseWidgetView {
    constructor() {
        super(...arguments); 
        const NewTemp = new DOMParser().parseFromString(this.Temp, "text/html")
        this.element = NewTemp                
    }

    render () {

        this.dom_class = 'Galaxy-uibuilder';

        //const input = this.model.get('inputs')
        
        //super.render() 

        //this.addRow()
        //this.CreateAForm()
        this.addConditional()


        // this.addInputFiled()
        // this.addDropdown()
        // this.UpLoadData()
        //this.addSections()
        // this.value_changed();
        // this.model.on('change:value', this.value_changed, this);

    }

    value_changed() {
        const input = this.model.get('inputs')
        this.el.textContent = input.label;
      }

    CreateAForm(){
        const Form = document.createElement("form")
        Form.className = "GalaxyForm"
        this.element.querySelector('.nbtools-body').appendChild(Form)
    }
   
     addInputFiled (rowID){
        const InputSection = document.createElement('section')
        InputSection.className = `input-section`
        this.element.querySelector('.GalaxyForm').appendChild(InputSection)
        const node = document.createElement("input");
        node.className = 'Input'
        this.element.querySelector('.input-section').appendChild(node)

     }

    UpLoadData (){  
        const UploadFile = document.createElement('section')
        UploadFile.className = `uploadfile-section`
        this.element.querySelector('.GalaxyForm').appendChild(UploadFile)
        const FileUpload = document.createElement('input')  
        FileUpload.type = 'file' 
        FileUpload.id = 'uploadInput'    
        FileUpload.style.color = 'transparent' 
        FileUpload.text = 'FileUpload'       
        this.element.querySelector('.uploadfile-section').appendChild(FileUpload)

    }

    addDropdown () {
        const options =  [ ['Mean Residue Ellipticity','mean residue ellipticity', 'False'],
                           ['Molar Ellipticity', 'molar ellipticity', 'False'],
                           ['Circular Dichroism', 'circular dichroism', 'False']];

        const select = document.createElement("select");
        
        for(var i = 0; i < options.length; i++) {
            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = options[i][1];
            select.appendChild(el);
        }

        const DropDownSection = document.createElement("section")
        DropDownSection.className = 'dropdown-section'
        this.element.querySelector('.GalaxyForm').appendChild(DropDownSection)
        this.element.querySelector('.dropdown-section').appendChild(select)

     }



     addFloat () {
        const floatValue = document.createElement('section')
        floatValue.className = `floatValue-section`
        this.element.querySelector('.GalaxyForm').appendChild(floatValue)
        const floatValueInput = document.createElement("input");
        floatValueInput.className = 'floatValueInput'
        this.element.querySelector('.floatValue-section').appendChild(floatValueInput)

     }



     addInteger () {
        const IntValue = document.createElement('section')
        IntValue.className = `IntValue-section`
        this.element.querySelector('.GalaxyForm').appendChild(IntValue)
        const floatValueInput = document.createElement("input");
        floatValueInput.className = 'IntValueInput'
        this.element.querySelector('.IntValue-section').appendChild(floatValueInput)
        this.element.querySelector('.IntValue-section').appendChild(Label)
         
    }

    addLabel() {
        const Label = document.createElement('label')
        this.element.querySelector('IntValueInput').appendChild(Label)

    }

   
    // uid() {
    //     top.__utils__uid__ = top.__utils__uid__ || 0;
    //     return `uid-${top.__utils__uid__++}`;
    // }

    addConditional () {

        const select = document.createElement("select");
        select.id = 'uid-1'
        console.log(select)

        const input = this.model.get('inputs')
        for (var i = 0; i < input[1].cases.length; i++) {
            //console.log(input[1].cases[i].value)
            const opt = input[1].cases[i].value;
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = input[1].cases[i].value;
            select.appendChild(el);
        }

        const DropDownSection = document.createElement("section")
        DropDownSection.className = 'dropdown-section'
        this.element.querySelector('.GalaxyForm').appendChild(DropDownSection)
        this.element.querySelector('.dropdown-section').appendChild(select)
        const select_element = document.querySelector('#uid-1');
 
        // select_element.onchange = function(e){
        //      if (!e)
        //         var e = window.event;
        //     var svalue = this.options[this.selectedIndex].value;
        //     alert( svalue );
        // } 
    }

    addRow (){
        this.portlet_content = document.createElement('div')

    }

    addSections () {

        const inputs = this.model.get('inputs')

        for(var i = 0; i < inputs.length; i++) {
            switch (inputs[i].type) {
                
                case "data":
                    this.addInputFiled();
                    break;
                case "select":
                    
                    console.log(inputs[i].type)
                    this.addDropdown();
                    break;
            }
        }
    }

}
