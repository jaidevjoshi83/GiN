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

        const GalaxyForm = document.createElement('form')
        GalaxyForm.className += 'galaxy-form'
        this.element.querySelector('div.nbtools-body').append(GalaxyForm)
        //this.AddInput(inputs[0])
        // this.AddSelectField(inputs[0])
        // this.AddFlot(inputs[0])
        // this.AddInteger(inputs[0])
        // this.AddText(inputs[0])
        // this.AddBooleanField(inputs[0])
        this.CreateSections(inputs)
    }

    uid () {
        top.__utils__uid__ = top.__utils__uid__ || 0;
        return `uid-${top.__utils__uid__++}`;
    }
    
   AddText (input_def) {

    input_def.id = this.uid()

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

   AddInteger (input_def) {

    input_def.id = this.uid()

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

   AddFlot (input_def) {

    input_def.id = this.uid()
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

    AddSelectField (input_def ) {

    input_def.id = this.uid()

    //const options = input_def.options




     const options =  input_def['test_param']['options']

    const select = document.createElement('select')

    for(var i = 0; i < options.length; i++) {
        const opt = options[i][0];
        const el = document.createElement("option");
        el.textContent = opt;
        el.value = options[i][1];
        select.appendChild(el);
    }

    select.id = `input-${input_def.id}`
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
    row.append(select)
    row.append(title)
    this.element.querySelector('.galaxy-form').append(row)
    }

    AddBooleanField (input_def ) {

        input_def.id = this.uid()
    
        const options =  [['True', 'True', 'true'],
                        ['False', 'False', 'false']]
    
        const select = document.createElement('select')
    
        for(var i = 0; i < options.length; i++) {
            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = options[i][1];
            select.appendChild(el);
        }
    
        select.id = `input-${input_def.id}`
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
        row.append(select)
        row.append(title)
        this.element.querySelector('.galaxy-form').append(row)
        }

    value_changed() {
        const input = this.model.get('inputs')
        this.el.textContent = input.label;
      }

    CreateSections (inputs) {

        for (var i in inputs) {
            if ( inputs[i].type !== 'conditional' ) {
                this.AddInteger(inputs[i])
                for (var i in inputs.cases) {
                    cases.inputs
                } 
            }

            else if (inputs[i].type === 'conditional')  {

                this.AddSelectField(inputs[i])
                console.log(inputs[i].cases)
                for (var j in inputs[i].cases[0]) {

                    this.CreateSections (inputs[i].cases[j].inputs)

                }


            }
        }
    }


}


