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
                        
    }
    render() {

        this.addDropdown();
    }

    addInput (){
        const node = document.createElement("input");   
        const FileUpload = document.createElement('input')  
        this.element.querySelector('.nbtools-body').appendChild(node)

    }

    UpLoadData (){  
        const FileUpload = document.createElement('input')  
        FileUpload.type = 'file' 
        FileUpload.id = 'uploadInput'    
        FileUpload.style.color = 'transparent' 
        FileUpload.text = 'FileUpload'       
        this.element.querySelector('.nbtools-body').appendChild(FileUpload)

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

        this.element.querySelector('.nbtools-body').appendChild(select)

    }

    BooleanLabel () {


        const BooleanButton = `<div class="nbtools-Label">
                                    <label>
                                        <input type="radio" name="choice-radio">
                                        Yes
                                    </label>
                                    <label>
                                        <input type="radio" name="choice-radio">
                                        No
                                    </label>
                                <div>`;

        const  ele = new DOMParser().parseFromString(BooleanButton, "text/html").querySelector('div.nbtools-label')
        console.log(ele)
        this.element.querySelector('.nbtools-body').appendChild(ele)

    }


    uid() {
        top.__utils__uid__ = top.__utils__uid__ || 0;
        return `uid-${top.__utils__uid__++}`;
    }

    // Conditional () {

    //     for (var i in input_def.cases) {
    //         var sub_section = new View(this.app, {
    //             inputs: input_def.cases[i].inputs,
    //             skip_render: true,
    //         });
    //         this.elements[input_def.id + "_" + i] = sub_section;
    //         this._append(sub_section.$el.addClass("ui-portlet-section pl-2"), `${input_def.id}-section-${i}`);
    //     }

    // }

    addSections (input_def) {

        switch (input_def.type) {
            case "data":
                this.UpLoadData(input_def);
                break;
            case "integer" || "float":
                this.addInput(input_def);
                break;
            case "boolean":
                this.BooleanLabel(input_def);
                break;
            case "select":
                this.addDropdown(input_def);
                break;
            case "conditional":
                for (var i in input_def.cases) {
                    var sub_section = addSections(input_def);
                    this.elements[input_def.id + "_" + i] = sub_section;
                    this._append(sub_section.this.element.addClass("ui-portlet-section pl-2"), `${input_def.id}-section-${i}`);
                }

        }

    // }
    // append  ($el, id) {
    //     this.$el.append($el.addClass("section-row").attr("id", id));
    // }
}
