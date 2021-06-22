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
        this.elements = {};   
           
    }

    render () {
        super.render()
        const inputs = this.model.get('inputs')
        //this.addSections(inputs)
        this.CreateForm(inputs)

    }

    uid () {
        top.__utils__uid__ = top.__utils__uid__ || 0;
        return `uid-${top.__utils__uid__++}`;
    }
    
    addRow(input_def) {

        switch (input_def.type) {
            
            case "data" :
                this.addInputField(input_def.id);
                break;
            case "select":
                console.log(inputs[i].type)
                this.AddSelectField(input_def.id, options);
                break;
            case "boolean":
                console.log(input_def.id)
                this.addDropdown();
                break;
        }

    }

    CreateForm (inputs){

        const GalaxyForm = document.createElement('form')
        GalaxyForm.className += 'galaxy-form'
        this.element.querySelector('div.nbtools-body').append(GalaxyForm)

        for (var i = 0; inputs.length > i; i++ ) {
            inputs.id = this.uid()
            if (inputs.type === "data") {
                const input = document.createElement('input')
                input.id = `input-${input_def.id}`
                const row = document.createElement('div')
                const title = document.createElement('div')
                title.className = 'ui-from-title'
                const TitleSpan = document.createElement('span')
                TitleSpan.className = "ui-form-title-text"
                TitleSpan.textContent = input_def.label
                TitleSpan.style.display = 'inline'
                title.append(TitleSpan)
                row.className = 'ui-form-element sectiono-row'
                row.id = input_def.id
                row.append(input)
                row.append(title)
                this.element.querySelector('.galaxy-form').append(row)

            }

        }


    }

    addInputField (input_def) {

        const input = document.createElement('input')
        input.id = `input-${input_def.id}`
        const row = document.createElement('div')
        const title = document.createElement('div')
        title.className = 'ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        row.className = 'ui-form-element sectiono-row'
        row.id = input_def.id
        row.append(input)
        row.append(title)
        this.element.querySelector('.galaxy-form').append(row)
    }

    addFloat (input_def) {

        const input = document.createElement('input')
        input.id = `input-${id}`
        const row = document.createElement('div')
        row.className = 'ui-form-element sectiono-row'
        row.id = id
        row.append(input)
        this.element.querySelector('.galaxy-form').append(row)
    }

    addInteger (input_def) {

        const input = document.createElement('input')
        input.id = `input-${id}`
        const row = document.createElement('div')
        row.className = 'ui-form-element sectiono-row'
        row.id = id
        row.append(input)
        this.element.querySelector('.galaxy-form').append(row)
    }


    AddSelectField (input_def ) {

        for(var i = 0; i < options.length; i++) {
            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = options[i][1];
            select.appendChild(el);
        }

        const select = document.createElement('select')
        const row = document.createElement('div')
        row.className = 'ui-form-element sectiono-row'
        row.id = id
        row.append(select)
        this.element.querySelector('.galaxy-form').append(row)
    }

    AddBooleanField (input_def) {

        const row = document.createElement('div')
        row.className = 'ui-form-element sectiono-row'
        row.id = id

        const TrueInput = document.createElement('input')
        TrueInput.type = 'radio'
        TrueInput.id = `True-${id}`
        TrueInput.text = 'True'

        const FalseInput = document.createElement('input')
        TrueInput.type = 'radio'
        TrueInput.id = `False-${id}`
        TrueInput.text = 'False'

        this.element.querySelector('.galaxy-form').append(TrueInput)
        this.element.querySelector('.galaxy-form').append(FalseInput)

    }

    value_changed() {
        const input = this.model.get('inputs')
        this.el.textContent = input.label;
      }

    addConditional (input_def) {

        for (var i in input_def.cases) {
            var sub_section = new GalaxyToolView({})

            this.elements[input_def.id + "_" + i] = sub_section;
            this._append(sub_section.$el.addClass("ui-portlet-section pl-2"), `${input_def.id}-section-${i}`);
        }

        const select = document.createElement('select')

        for (var i = 0; i < input_def.cases.length; i++) {
            const opt = input_def.cases[i].value;
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = input_def.cases[i].value;
            select.appendChild(el);
        }

 
        const row = document.createElement('div')
        row.className = 'ui-form-element sectiono-row pl-2'
        row.id = input_def.id

        row.append(select)
        this.element.querySelector('.galaxy-form').append(row)
    }

    addSections (inputs) {

        const GalaxyForm = document.createElement('form')
        GalaxyForm.className += 'galaxy-form'
        this.element.querySelector('div.nbtools-body').append(GalaxyForm)

        //const inputs = this.model.get('inputs')

        for(var i = 0; i < inputs.length; i++) {

            inputs[i].id = this.uid()

            
            switch (inputs[i].type) {
     
                case "data" :
                    this.addInputField(inputs[i]);
                    break;
                case "integer" :
                    this.addRow(inputs[i]);
                    break;
                case "text":
                    this.addRow(inputs[i]);
                    break;

                // case "conditional":
                //     this.addConditional(inputs[i]);
                //     break;
            }
        }
    }

}


