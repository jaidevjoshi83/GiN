import '../style/galaxyoutput.css';
import { unpack_models } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import  { BaseWidgetModel, BaseWidgetView } from "@genepattern/nbtools";
import $ from "jquery";
import _ from "underscore";
import { ContextManager } from '@genepattern/nbtools';
import { NotebookPanel } from "@jupyterlab/notebook";



export class GalaxyToolModel extends BaseWidgetModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyToolModel.model_name, _model_module: GalaxyToolModel.model_module, _model_module_version: GalaxyToolModel.model_module_version, _view_name: GalaxyToolModel.view_name, _view_module: GalaxyToolModel.view_module, _view_module_version: GalaxyToolModel.view_module_version, name: 'Python Results', description: '', status: '', files: [], text: '', visualization: '', appendix: undefined, extra_file_menu_items: {}, inputs:{}, File:'' });
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
        
        ContextManager.context().notebook_focus((current_widget) => {
            // Current notebook hasn't changed, no need to do anything, return
            if (this.current === current_widget)
                return;
            // Otherwise, update the current notebook reference
            this.current = current_widget;
            // If the current selected widget isn't a notebook, no comm is needed
            if (!(this.current instanceof NotebookPanel) && ContextManager.is_lab())
                return;
            // Initialize the comm
        });
          
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

        //  let notebook 
        // //  ContextManager.context().execute_code(notebook, 'import requests')
        //  while (notebook !== null ) {
        // console.log(ContextManager)
 
        console.trace("Trace")
        //   }
    }

    CreateForm() {
        var self = this

        const GalaxyForm = document.createElement('form')

        let btn = document.createElement("button");
        btn.innerHTML = "Click Me";

        GalaxyForm.className = 'Galaxy-form'
        this.element.querySelector('div.nbtools-body').append(GalaxyForm)
        this.element.querySelector('div.nbtools-body').appendChild(btn)

        btn.addEventListener("click", function() {

            var children = self.element.querySelector('.Galaxy-form').children;
            const notebook = ContextManager.tool_registry.current

            console.log('OK1')
            var children = self.element.querySelector('.Galaxy-form').children;
            self.ReturnData(children) 
            console.log('OK3')

        }, false);
    }

    ReturnData(FormEelements){

        var SimpleInputs = []

        for (var i = 0; i < FormEelements.length; i++) {

            if (FormEelements[i].className == 'ui-form-element section-row'){
                var tableChild = FormEelements[i];

                console.log(tableChild.querySelector('.InputData').name)

            }  

           else if (FormEelements[i].className == 'ui-form-element section-row conditional'){
                var tableChild = FormEelements[i];

                console.log(tableChild.querySelector('.InputData').name)

            }  

            else  if (FormEelements[i].className == 'ui-form-element section-row pl-2' && FormEelements[i].style.display == 'block'){

                 var tableChild1 = FormEelements[i].children;

                 this.ReturnData(tableChild1)

             }
        }

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
                this.element.querySelector('.Galaxy-form').append(this.FileUpLoad(input_def))
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


    AddText (input_def) {

        input_def.id = this.uid()

        const input = document.createElement('input')
        input.id = `input-${input_def.id}`
        input.name = input_def['name']
        input.value = input_def['value']
        input.className = 'InputData'
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
        row.append(title)
        row.append(input)
        return row
    }

    FileUpLoad (input_def) {

        var self = this
        input_def.id = this.uid()

        const Label = document.createElement('label')
        Label.className = 'custom_file_upload'
        const Input = document.createElement('input')
        Input.type = 'file'
        
        const Input1 = document.createElement('input')
        Input1.type = 'text'
        Input1.className = 'InputData'
        Input1.name = input_def['name']
        Input1.setAttribute("list","history-data-list")

        const DataList = document.createElement('datalist')
        DataList.id = `history-data-list`

        var options = this.model.get('History_Data')


        for(var i = 0; i < this.model.get('History_Data').length; i++) {
            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = options[i][1];
            DataList.appendChild(el);
      }

        Label.append(Input)
        Label.append(Input1)
        Label.append(DataList)
        const Li = document.createElement('i')
        Li.innerText = ' Upload Data'
        Li.className = "fa fa-cloud-upload"
        Label.append(Li)

        const row = document.createElement('div')
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(Label)

        Input.addEventListener("change", function() {

            console.log(Input.files[0].name);

            self.model.set('File', Input.files[0].name);
            self.model.save_changes();
            Input1.value = Input.files[0].name

        }, false);
        return row

    }

    AddInteger (input_def) {

        input_def.id = this.uid()
        const input = document.createElement('input')
        input.value = input_def['value']
        input.className = 'InputData'
        input.name = input_def['name']
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
        row.append(title)
        row.append(input)
        
        return row
    }


    AddFloat (input_def) {

        input_def.id = this.uid()
        const input = document.createElement('input')
        input.value = input_def['value']
        input.name = input_def.name
        input.id = `input-${input_def.id}`
        input.className = 'InputData'
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
        row.append(title)
        row.append(input)
        return row
    }

    AddConditionalSelectField (input_def, ElID ) {

        var self = this

        const options =  input_def['test_param']['options']
        const select = document.createElement('select')
        select.name = input_def['name']+"|"+input_def['test_param']['name']

        select.id = `select-${input_def.id}`    
        select.className = 'InputData' 
     
        for(var i = 0; i < options.length; i++) {
              const opt = options[i][0];
              const el = document.createElement("option");
              el.textContent = opt;
              el.value = options[i][1];
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
        row.className = 'ui-form-element section-row conditional'
        row.id = input_def.id
        row.append(title)
        row.append(select)
        

        select.addEventListener("change", () => {

            var queryID = select.value

            for (var i in ElID) {
                if (options[i][1] == queryID ) {
                    this.el.querySelector(`#${ElID[i]}`).style.display = 'block'
                } else {
                    this.el.querySelector(`#${ElID[i]}`).style.display = 'none'
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
        select.className = 'InputData'   
        select.name = input_def['name']
     
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
        row.append(title)
        row.append(select)
        

        select.addEventListener("change", () => {

            var queryID = select.value

            console.log(queryID)
        });

        return row

    }

    AddBooleanField (input_def ) {

        input_def.id = this.uid()

        const options =  [['True', 'True', 'True'],
                        ['False', 'False', 'False']]


        const select = document.createElement('select')

        select.name = input_def['name']

        for(var i = 0; i < options.length; i++) {
            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = options[i][1];
            select.appendChild(el);
        }

        select.id = `input-${input_def.id}`
        select.className = 'InputData' 
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
        row.append(title)
        row.append(select)
        
        this.el.querySelector('.nbtools-form').append(row)

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
          ConditionalDiv.className = 'ui-form-element section-row pl-2'
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
                 SimpleRow = this.FileUpLoad(input_def.cases[i].inputs[j])

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