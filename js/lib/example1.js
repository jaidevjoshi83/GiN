import '../style/galaxyoutput.css';

import { unpack_models } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import  { BaseWidgetModel, BaseWidgetView } from "@genepattern/nbtools";
import $ from "jquery";
import _ from "underscore";
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


    initialize (inputs){

        this.inputs = inputs

    }

    render  () {
        super.render()
        const inputs = this.model.get('inputs')
        this.CreateForm()
        var self = this;
        _.each(inputs, (input) => {
            self.add(input);
        });
  
    }

    CreateForm() {

        const GalaxyForm = document.createElement('form')
        GalaxyForm.className = 'Galaxy-form'
        this.element.querySelector('div.nbtools-body').append(GalaxyForm)
    }

    uid () {
        top.__utils__uid__ = top.__utils__uid__ || 0;
        return `uid-${top.__utils__uid__++}`;
    }

    add  ( input ) {
        
        var input_def = input;
       // input_def.id = this.uid();
  
        switch (input_def.type) {
            case "conditional":
                this.AddConditoinalSection2(input_def,this.element.querySelector('.Galaxy-form'));
                break;
            case "data":
            
                this.element.querySelector('.Galaxy-form').append(this.AddInteger(input_def))
                break
            case "text":
                this.element.querySelector('.Galaxy-form').append(this.AddText(input_def))
                break
            case "integer":
                this.element.querySelector('.Galaxy-form').append(this.AddInteger(input_def))
                break
            case "float":
                this.element.querySelector('.Galaxy-form').append(this.AddFloat(input_def))
                break
            case "boolean":
                this.element.querySelector('.Galaxy-form').append(this.AddBooleanField(input_def))
                break
            case "select":
                this.element.querySelector('.Galaxy-form').append(this.AddSelectField(input_def))
                break
  
        }
    }

    // AddInputRow(input_def) {

    //     switch(input_def.type) {

    //         case "data":
                
    //             this.element.querySelector('.Galaxy-form').append(this.AddInteger(input_def))
    //             break
    //         case "text":
    //             this.element.querySelector('.Galaxy-form').append(this.AddText(input_def))
    //             break
    //         case "integer":
    //             this.element.querySelector('.Galaxy-form').append(this.AddInteger(input_def))
    //             break
    //         case "float":
    //             this.element.querySelector('.Galaxy-form').append(this.AddFloat(input_def))
    //             break
    //         case "boolean":
    //             this.element.querySelector('.Galaxy-form').append(this.AddBooleanField(input_def))
    //             break
    //         case "select":
    //             console.log(input_def['name'])
    //             this.element.querySelector('.Galaxy-form').append(this.AddSelectField(input_def))
    //             break

    //     }

    // }

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
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(input)
        row.append(title)
        return row

    }

    AddInteger (input_def) {

        input_def.id = this.uid()
        const input = document.createElement('input')
        input.id = input_def.id
        const row = document.createElement('div')
        const title = document.createElement('div')
        title.className = 'ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(input)
        row.append(title)
        
        return row

    }

    AddFloat (input_def) {

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
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(input)
        row.append(title)

        return row

    }

    AddConditionalSelectField (input_def, ElID ) {

        var self = this

        const options =  input_def['test_param']['options']
        const select = document.createElement('select')
        select.id = `select-${input_def.id}`     
     
        for(var i = 0; i < options.length; i++) {
              const opt = options[i][0];
              const el = document.createElement("option");
              el.textContent = opt;
              el.value = i;
              select.appendChild(el);
        }
     
        select[0].selected = 'selected'
     
        const row = document.createElement('div')
        const title = document.createElement('div')
        title.className = 'ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def['test_param']['label']

        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(select)
        row.append(title)

        select.addEventListener("change", () => {

            var queryID = select.value

            console.log(queryID)
            console.log(ElID)

            for (var i in ElID) {
                if (i == queryID ) {
                    this.element.querySelector(`#${ElID[i]}`).style.display = 'block'
                } else {
                    this.element.querySelector(`#${ElID[i]}`).style.display = 'none'
                }
            }
        });

        return row

    }

    AddSelectField (input_def) {

        var self = this

        const options =  input_def['options']
        const select = document.createElement('select')
        select.id = `select-${input_def.id}`     
     
        for(var i = 0; i < options.length; i++) {
              const opt = options[i][0];
              const el = document.createElement("option");
              el.textContent = opt;
              el.value =  options[i][1];
              select.appendChild(el);
        }
     
        select[0].selected = 'selected'
     
        const row = document.createElement('div')
        const title = document.createElement('div')
        title.className = 'ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def['label']

        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(select)
        row.append(title)

        select.addEventListener("change", () => {

            var queryID = select.value

            console.log(queryID)
        });

        return row

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
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(select)
        row.append(title)
        this.element.querySelector('.Galaxy-form').append(row)

        return row
    }

    AddConditoinalSection2 (input_def,parent) {



        input_def.id = this.uid()

        const ElementIDs = []

        for (var e in input_def.cases) {

            ElementIDs.push(`${input_def.id}-section-${e}`)
        }

        const Selectfiled = this.AddConditionalSelectField(input_def, ElementIDs)

        parent.append(Selectfiled)

        var ConditionalDiv

        for (var i in input_def.cases) {
          ConditionalDiv = document.createElement('div')
          ConditionalDiv.className = 'ui-form-element section-row pl-2 '
          ConditionalDiv.id = `${input_def.id}-section-${i}`

          if (i == 0){
            ConditionalDiv.style.display = 'block'
         } else {
            ConditionalDiv.style.display = 'none'
         }

          for (var j in input_def.cases[i].inputs) {

            
            if (input_def.cases[i].inputs[j].type !== 'conditional') {
              input_def.cases[i].inputs[j].id = this.uid()

              var SimpleRow 


              if (input_def.cases[i].inputs[j].type == 'data') {
                 SimpleRow = this.AddInteger(input_def.cases[i].inputs[j])

              } else if (input_def.cases[i].inputs[j].type == 'integer') {
                 SimpleRow = this.AddInteger(input_def.cases[i].inputs[j])

              } else if (input_def.cases[i].inputs[j].type == 'float') {
                   SimpleRow = this.AddFloat(input_def.cases[i].inputs[j])

              } else if (input_def.cases[i].inputs[j].type == 'boolean') {
                   SimpleRow = this.AddBooleanField(input_def.cases[i].inputs[j])

              } else if (input_def.cases[i].inputs[j].type == 'text') {
                  SimpleRow = this.AddText(input_def.cases[i].inputs[j])
              }
              else if (input_def.cases[i].inputs[j].type == 'select') {
                   SimpleRow = this.AddSelectField(input_def.cases[i].inputs[j])
              }

              ConditionalDiv.append(SimpleRow)
            } else {
              
              input_def.cases[i].inputs[j].id = this.uid()
              this.AddConditoinalSection2(input_def.cases[i].inputs[j],ConditionalDiv)
            }
          }

          parent.append(ConditionalDiv)
        }
      } 

}