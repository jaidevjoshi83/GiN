//import '../style/galaxyoutput.css';

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

    // render () {
    //     const inputs = this.model.get('inputs')
    //     super.render()
    //     this.CreateForm()
    //     this.AddConditoinalSection(inputs[2])
    // }

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
                this.AddInteger(input_def);
                break;
  
        }
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
    row.className = 'ui-form-element section-row'
    row.id = input_def.id
    row.append(input)
    row.append(title)
    this.element.querySelector('.galaxy-form').append(row)
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
    //this.element.querySelector('.Galaxy-form').append(row)
    return row

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
    row.className = 'ui-form-element section-row'
    row.id = input_def.id
    row.append(input)
    row.append(title)
    this.element.querySelector('.Galaxy-form').append(row)

    return row

    }

    AddSelectField (input_def ) {

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
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(select)
        row.append(title)

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

    value_changed() {
        const input = this.model.get('inputs')
        this.el.textContent = input.label;
    }

    AddConditoinalSection (input_def ) {

        const Elements = []

        var self = this
        input_def.id = this.uid()
        this.return_value = ''
    
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
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        row.append(select)
        row.append(title)
        
        this.element.querySelector('.Galaxy-form').append(row)
        const SelectEl = this.element.querySelector(`#select-${input_def.id}`);

        for (var i in input_def.cases ) {

            const ConditionalDiv = document.createElement('div')
            ConditionalDiv.className = 'ui-form-element section-row pl-2'
            ConditionalDiv.id = `${input_def.id}-section-${i}`

            Elements.push(ConditionalDiv)
            
            if (i == 0){
                ConditionalDiv.style.display = 'block'
            } else {
                ConditionalDiv.style.display = 'none'
            }

            this.element.querySelector('.Galaxy-form').append(ConditionalDiv)

            for (var j in input_def.cases[i].inputs) {

               if (input_def.cases[i].inputs[j].type === 'conditional'){
                    this.AddConditoinalSection(input_def.cases[i].inputs[j])

               } else {
                    console.log(Object.keys(input_def.cases[i].inputs[j]))
                    this.AddInteger(input_def.cases[i].inputs[j])
                    ConditionalDiv.append(this.AddInteger(input_def.cases[i].inputs[j]))
               }
            }
        }

        SelectEl.addEventListener("change", () => {

            var queryID = SelectEl.value

            for (var i in Elements) {
                if (i == queryID ) {
                    Elements[i].style.display = 'block'
                } else {
                    Elements[i].style.display = 'none'
                }
            }
        });

        }



    CreateASubsection(input_def, i) {

        const ConditionalDiv = document.createElement('div')
        ConditionalDiv.className = 'ui-form-element section-row pl-2'
        ConditionalDiv.id = `${input_def.id}-section-${i}`

        return ConditionalDiv
    }

    AddConditoinalSection1 (input_def ) {

        // input_def.id = this.uid()

        const row = this.AddSelectField(input_def )
        this.element.querySelector('.Galaxy-form').append(row)
        console.log(input_def.id, '########')
        console.log(input_def.test_param.options)

        for (var i in input_def.cases) {

            console.log(this.CreateASubsection(input_def, i))

            for (var j in input_def.cases[i].inputs ) {

                if (input_def.cases[i].inputs[j].type !== 'conditional' ) {
                    input_def.id = this.uid()
                    console.log(input_def.cases[i].inputs[j].label)
                }
                else {
                    //const SubSection1 = document.createElement('div')
                    //SubSection1.id = `subsection-${input_def.cases[i].inputs[j].id}`
                    //SubSection.append(SubSection1)       
                    console.log('###########################################')
                    this.AddConditoinalSection1(input_def.cases[i].inputs[j])

                } 
            }

        }
        //this.element.querySelector('.Galaxy-form').append(SubSection)
    }


    // AddConditoinalSection2 (input_def ) {

    //     input_def.id = this.uid()

    //     var ConditionalDiv

    //     for (var i in input_def.cases) {

    //         ConditionalDiv  = document.createElement('div')
    //         ConditionalDiv.className = 'ui-form-element section-row pl-2'
    //         ConditionalDiv.id = `${input_def.id}-section-${i}`
        
    //         for (var j in input_def.cases[i].inputs ) {

    //             if (input_def.cases[i].inputs[j].type !== 'conditional') {

    //                 input_def.cases[i].inputs[j].id = this.uid()
    //                 const SimpleRow  = document.createElement('div')
    //                 SimpleRow.className = 'ui-form-element section-row' 
    //                 SimpleRow.id = input_def.cases[i].inputs[j].id
    //                 ConditionalDiv.append(SimpleRow)
    //             } 

    //             else{

    //                 input_def.cases[i].inputs[j].id = this.uid()
    //                 this.AddConditoinalSection2(input_def.cases[i].inputs[j])
    //             }
    //         }

    //         this.element.querySelector('.Galaxy-form').append(ConditionalDiv)
    //     }
    // }    

    AddConditoinalSection2 (input_def,parent) {
        input_def.id = this.uid()

        var ConditionalDiv

        for (var i in input_def.cases) {
          ConditionalDiv = document.createElement('div')
          ConditionalDiv.className = 'ui-form-element section-row pl-2 '+input_def.cases[i].value
          ConditionalDiv.id = `${input_def.id}-section-${i}`

          for (var j in input_def.cases[i].inputs) {
            if (input_def.cases[i].inputs[j].type !== 'conditional') {
              input_def.cases[i].inputs[j].id = this.uid()
              const SimpleRow = document.createElement('div')
              SimpleRow.className = 'ui-form-element section-row '+input_def.cases[i].inputs[j].name
              SimpleRow.id = input_def.cases[i].inputs[j].id
              ConditionalDiv.append(SimpleRow)
            } else {
              input_def.cases[i].inputs[j].id = this.uid()
              this.AddConditoinalSection2(input_def.cases[i].inputs[j],ConditionalDiv)
            }
          }

          parent.append(ConditionalDiv)
        }
      }

     
    AddConditoinalSection4 (input_def ) {

        var Elements
        input_def.id = this.uid()
        var ConditionalDiv

        for (var i in input_def.cases) {

            ConditionalDiv  = document.createElement('div')
            ConditionalDiv.className = 'ui-form-element section-row pl-2'
            ConditionalDiv.id = `${input_def.id}-section-${i}`
        
            for (var j in input_def.cases[i].inputs ) {

                input_def.cases[i].inputs[j].id = this.uid()
                const SimpleRow  = document.createElement('div')
                SimpleRow.className = 'ui-form-element section-row' 
                SimpleRow.id = input_def.cases[i].inputs[j].id
                ConditionalDiv.append(SimpleRow)

                } 
                Elements.push(ConditionalDiv)
            }
    
        }  

    CreateSections (inputs) {
        var self = this

        for (var i in inputs) {
            if ( inputs[i].type !== 'conditional' ) {
                this.AddInteger(inputs[i])
                for (var i in inputs.cases) {
                    cases.inputs
                } 
            }
            else if (inputs[i].type === 'conditional')  {

                this.AddSelectField(inputs[i])
                for (var j in inputs[i].cases) {

                    this.CreateSections (inputs[i].cases[j].inputs)

                }


            }
        }
    }

}


