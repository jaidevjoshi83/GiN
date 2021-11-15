/**
 * Define the UI Builder widget for Jupyter Notebook
 *
 * @author Thorin Tabor
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */
 import '../style/Galaxyuibuilder.css';
 import '../style/historydata.css';

 import { MODULE_NAME, MODULE_VERSION } from './version';
 import { unpack_models } from "@jupyter-widgets/base";
 //import { UIBuilderModel, UIBuilderView } from "@genepattern/nbtools";
 import { BaseWidgetModel, BaseWidgetView } from "@genepattern/nbtools";
 import { element_rendered, toggle } from "./utils";
 
 import { SessionContext, sessionContextDialogs, } from '@jupyterlab/apputils';
 import { KernelModel } from './model';
 import _ from "underscore";
 import { Toolbox } from '@genepattern/nbtools';
 import {  KernelSideDataObjects } from './utils';

 
export class GalaxyUIBuilderModel extends BaseWidgetModel{
     
     defaults() {
         return Object.assign(Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyUIBuilderModel.model_name, _model_module: GalaxyUIBuilderModel.model_module, _model_module_version: GalaxyUIBuilderModel.model_module_version, _view_name: GalaxyUIBuilderModel.view_name, _view_module: GalaxyUIBuilderModel.view_module, _view_module_version: GalaxyUIBuilderModel.view_module_version, name: 'Python Function', description: '', origin: '', _parameters: [], parameter_groups: [], function_import: '', register_tool: true, collapse: true, events: {}, buttons: {}, display_header: true, display_footer: true, busy: false, run_label: 'Execute', GalInstance: {}, output: undefined, inputs:{}, form_output:{}, History_Data:[], UI:{}, ToolID:'', HistoryData:[] }));
     }
 }
 GalaxyUIBuilderModel.model_name = 'GalaxyUIBuilderModel';
 GalaxyUIBuilderModel.model_module = MODULE_NAME;
 GalaxyUIBuilderModel.model_module_version = MODULE_VERSION;
 GalaxyUIBuilderModel.view_name = 'GalaxyUIBuilderView';
 GalaxyUIBuilderModel.view_module = MODULE_NAME;
 GalaxyUIBuilderModel.view_module_version = MODULE_VERSION;
 GalaxyUIBuilderModel.serializers = Object.assign(Object.assign({}, BaseWidgetModel.serializers), { tool: {
         deserialize: (value, manager) => unpack_models(value, manager)
     } });
export class GalaxyUIBuilderView extends BaseWidgetView {
     constructor() {
        super(...arguments);
        this.dom_class = 'nbtools-uibuilder';
        this.traitlets = [...super.basics(), 'origin', '_parameters', 'function_import', 'register_tool', 'collapse',
            'events', 'run_label', 'tool'];
        this.renderers = {
            "error": this.render_error,
            "info": this.render_info
        };
        this.body = `
        <div class="nbtools-buttons">
            <button class="nbtools-run" type="button" data-traitlet="run_label"></button>
        </div>
        <div class="nbtools-description" data-traitlet="description"></div>
        <div class="nbtools-busy">
            <div>
                <i class="fas fa-circle-notch fa-spin"></i>
            </div>
        </div>
        <div class="nbtools-error" data-traitlet="error"></div>
        <div class="nbtools-info" data-traitlet="info"></div>
        <div class="dataset-list"></div> 
        <div class="nbtools-form"></div>
        <div class="nbtools-footer"></div>
        <div class="nbtools-buttons">
            <button class="nbtools-run" type="button" data-traitlet="run_label"></button>
        </div>`;
        this.dragged = ''
        this.KernelOutPut = ''
        this.JOBID = {}
 
    }
 
    render() {

        // super.render()
        // this.activate_run_buttons();
        // this.toggle_code(false);

        super.render();

        const inputs = this.model.get('inputs')
        
        //########################

        this.CreateForm()
        this.Main_Form(inputs['inputs'])
        this.Data_Tool()
        this.AddHelpSection(inputs['help'])
       

        //########################

        // // Hide the header or footer, if necessary
        this.display_header_changed();
        this.display_footer_changed();
        this.model.on(`change:display_header`, this.display_header_changed, this);
        this.model.on(`change:display_footer`, this.display_footer_changed, this);
        // // Show or hide the "busy" UI
        this.busy_changed();
        this.model.on(`change:busy`, this.busy_changed, this);
        // Attach the Reset Parameters gear option
        this.add_menu_item('Reset Parameters', () => this.reset_parameters());
        // Attach the Run button callbacks
        this.activate_run_buttons();
        // Attach custom buttons
        this.activate_custom_buttons();
        //Add the interactive form widget
        // this.attach_child_widget('.nbtools-form', 'form');
        // // After the view is rendered
        // element_rendered(this.el).then(() => {
        //     // Attach ID and event callbacks
        //     this._attach_callbacks();
        //     // Create parameter groups
        //     this._init_parameter_groups();
        // });

        
    }
 
    Main_Form (inputs, call_back_data={}) {

        var FormParent = this.el.querySelector('.Galaxy-form');

        var HistList = this.AddHistoryList(call_back_data['HID'])
        FormParent.append(HistList)

        var self = this
        _.each(inputs, (input) => {
        //  console.log(selected_value)
            self.add(input, FormParent, '', call_back_data);
        });
    }

    async Data_Tool(selected_value='default', Dt=[], state=''){
    
        var DataList = this.el.querySelector('.dataset-list');
        if (DataList){
            this.removeAllChildNodes(DataList)
        }
        DataList.append(await this.AddDataSetTable(selected_value, Dt, state))
    
    }
 
    CreateForm() {  //Fix me in future

        var self = this

        const GalaxyForm = document.createElement('form')
        GalaxyForm.className = 'Galaxy-form'
        this.el.querySelector('div.nbtools-form').append(GalaxyForm)
        const Button = document.createElement('button')
        Button.style.display = 'none'
        Button.type = 'button'
        Button.id = 'submit'
        Button.className  = 'Galaxy-form-button'

        GalaxyForm.append(Button)
    }

    TimerFunc(value){

        var i = 0, howManyTimes = 10;

        function f() {
        console.log(value);
        i++;
        if (i < howManyTimes) {
            setTimeout(f, 3000);
        }
        }
   
        f();

        return value

    }
    
    ReturnDataFiles(Select){

        var Data = {}
        var InputPerameters ={}
        var Values = {}
        var Indexes = []

        var selected1 = [];
        for (var i = 0; i < Select.length; i++) {
            if (Select.options[i].selected) {
                selected1.push(Select.options[i].value);
                Indexes.push(i)
            }
        }

        Values['values'] = selected1

        InputPerameters[Select.name] = Values

        Data['Inputs_data_files'] = InputPerameters
        Data['Selected_data_Indexes'] = Indexes
        Data['select_type'] = Select.multiple

        return  Data 
    }
 
    ReturnData(FormEelements){
 
        var InputPerameters = {}
        var Values = {}
 
        for (var i = 0; i < FormEelements.length; i++) {

            if (FormEelements[i].className == 'ui-form-element section-row'){
                var tableChild = FormEelements[i];

                if (tableChild.querySelector('.InputData') !== null){
                    InputPerameters[tableChild.querySelector('.InputData').name] = tableChild.querySelector('.InputData').value
                } 
                else {

                    var Select = tableChild.querySelector('.selectbox-scrollable')
                    Object.assign(InputPerameters, this.ReturnDataFiles(Select)['Inputs_data_files'])
                }

            } 

            else if (FormEelements[i].className == 'drill-down ui-form-element section-row'){

                var tableChild = FormEelements[i];
                Object.assign(InputPerameters, this.Dirll_Down_Output(tableChild.querySelector('.outer-drill').children))
            } 

            else if (FormEelements[i].className == 'ui-form-element section-row conditional'){
                    var tableChild = FormEelements[i];
                    InputPerameters[tableChild.querySelector('.InputData').name] = tableChild.querySelector('.InputData').value
            } 
                
            else if (FormEelements[i].className == 'ui-form-element section-row pl-2' && FormEelements[i].style.display == 'block'){
                    var tableChild1 = FormEelements[i].children;
                    Object.assign(InputPerameters, this.ReturnData(tableChild1))
            }

            else if (FormEelements[i].className == 'ui-portlet-section section-row') {
                    var tableChild1 = FormEelements[i].children;
                    Object.assign(InputPerameters, this.ReturnData(tableChild1))
            }

            else if (FormEelements[i].className == 'ui-form-element section-row sections')  {
                    var tableChild1 = FormEelements[i].children;
                    Object.assign(InputPerameters, this.ReturnData(tableChild1))
            }

            else if (FormEelements[i].className == 'ui-repeat section-row'){
                // console.log(FormEelements[i].children)
                var tableChild1 = FormEelements[i].children;
                Object.assign(InputPerameters, this.ReturnData(tableChild1))
            }

            else if (FormEelements[i].className == 'internal-ui-repeat section-row'){
                var tableChild1 = FormEelements[i].children;
                console.log(tableChild1)
                Object.assign(InputPerameters, this.ReturnData(tableChild1))
            }
 
        }
 
        return InputPerameters
    }
 
    uid () {
        top.__utils__uid__ = top.__utils__uid__ || 0;
        return `uid-${top.__utils__uid__++}`;
    }
 
    add  ( input, FormParent, NamePrefix, data={}) {

        var input_def = input;
        // input_def.id = this.uid();
        if (input_def.id == 'undefined') {
            input_def.id = this.uid()
        }

        // console.log(input_def.type)

        switch (input_def.type) {
            
            case "conditional":
                this.AddConditoinalSection2(input_def, FormParent, NamePrefix, data);
                break;
            case "data":
                    this.FileUpLoad(input_def, FormParent, NamePrefix, data)
                break
            case "text":
                this.AddText(input_def, FormParent, NamePrefix);
                break
            case "integer":
                this.AddInteger(input_def, FormParent, NamePrefix)
                break
            case "float":
                this.AddFloat(input_def, FormParent, NamePrefix)
                break
            case "boolean":
                this.AddBooleanField(input_def, FormParent, NamePrefix)
                break
            case "select":
                this.AddSelectField(input_def, FormParent, NamePrefix)
                break
            case "repeat":
                this.AddRepeat(input_def, FormParent, NamePrefix) 
                break
            case "section":
                this.AddSection(input_def, FormParent, NamePrefix) 
                break
            case "drill_down":
                console.log('drill_ok')
                console.log(input_def)
                this.AddDrill_Down(input_def, FormParent, NamePrefix)
                break
        }
    }

    Dirll_Down_Output(drill_down){

        var Name = []
        var values = {} 
        var Key = []

        for(var i = 0; i < drill_down.length; i++){

            if (drill_down[i].className == 'outer-drill') {
                for (var j = 0; j <  drill_down[i].children.length; j++) {
                    if (drill_down[i].children[j].className == 'inner-div'){
                        if (drill_down[i].children[j].children[0].checked == true) {
                            Name.push(drill_down[i].children[j].children[0].name)
                            Key.push(drill_down[i].children[j].children[0].value)
                        }
                    }
                }
                this.Dirll_Down_Output(drill_down[i].children)

                Object.assign(values, this.Dirll_Down_Output(drill_down[i].children))
            }
        }

        if (Name.length !== 0 ) {
            values[Name[0]] = Key
            
        } 
        return values
        
    }


    Drill_down(options, param_name='default'){

        var OuterDrillDown = document.createElement('div')
        OuterDrillDown.className = 'outer-drill'

        const Icon = document.createElement('span')
        Icon.className = 'icon fa mr-1 fa-check-square-o'

        OuterDrillDown.append(Icon)

        for(var i=0; i<options.length; i++){

            const Innerdiv  = document.createElement('div')
            Innerdiv.className = 'inner-div'
            var InputID = `input-id-${this.uid()}`

            var Input = document.createElement('input')
            Input.id = InputID
            Input.value = options[i]['value']
            Input.style.maxWidth = '20px'
            Input.style.float = 'left'
            Input.name = param_name

            var Label = document.createElement('label')
            Label.setAttribute('for', InputID)
            Label.innerText = options[i]['name']
            Label.style.width= "80%"

            Input.type = 'checkbox'
            OuterDrillDown.style.marginLeft = "20px"

            Innerdiv.append(Input)
            Innerdiv.append(Label)
            
            OuterDrillDown.append(Innerdiv)

            if (options[i]['options'].length !== 0 ) {
                OuterDrillDown.append(this.Drill_down(options[i]['options'], param_name))
            }

        }

        return OuterDrillDown
    }

    AddDrill_Down(input_def, FormParent, NamePrefix) {
        input_def.id = this.uid()

        const title = document.createElement('div')
        title.className = 'ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)

        const UIFormField = document.createElement('div')
        UIFormField.className = 'ui-form-field'

        const UIFormOption = document.createElement('div')
        UIFormOption.className  = 'ui-options'
        UIFormOption.id = `field-uid-${input_def.id}`

        const UIOptionsMenu = document.createElement('div')
        UIOptionsMenu.className =  'ui-options-menu'

        const MBuiButtonCheck = document.createElement('div')
        MBuiButtonCheck.className = 'mb-2 ui-button-check'

        const Icon = document.createElement('span')
        Icon.className = 'icon fa mr-1 fa-check-square-o'


        Icon.addEventListener("click", () => {

            if (Icon.className == 'icon fa mr-1 fa-check-square-o')
              Icon.className = 'icon fa mr-1 fa-square-o'
            else {
                Icon.className = 'icon fa mr-1 fa-check-square-o'
            }
        });

        const Parent = document.createElement('div')
        Parent.className = 'drill-down-main'

        const SelectTitle = document.createElement('span')
        SelectTitle.innerText = 'Select/Unselect all'
        SelectTitle.style.paddingLeft = '5px'

        MBuiButtonCheck.append(Icon)
        MBuiButtonCheck.append(SelectTitle)
        UIOptionsMenu.append(MBuiButtonCheck)
        UIFormOption.append(UIOptionsMenu)
        UIFormField.append(UIFormOption)

        const row = document.createElement('div')
        row.className = 'drill-down ui-form-element section-row'
        row.id = `uid-${input_def.id}`

        row.append(title)
        row.append(UIFormField)
        row.append(this.Drill_down(input_def['options'], input_def['name'] ))

        FormParent.append(row)
        return row
    }

 
    AddText (input_def, FormParent, NamePrefix) {

         input_def.id = this.uid()
 
        const input = document.createElement('input')
        input.id = `input-${input_def.id}`
        input.name = NamePrefix+input_def['name']
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
        title.style.float = 'left'
        row.append(title)
        row.append(input)
        FormParent.append(row)
        return row
     }


    async AddOutPutDataTable( JobID) {

        var InitialData = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.OutPutData(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, JobID=${JSON.stringify(JobID)} )`);

        var self = this

        var DataTable = document.createElement('ul')
        DataTable.className = 'galaxy-data-panel'

        var Dt = []

        for(var i = 0; i < InitialData.length; i++) {

            var Data = JSON.stringify(InitialData[i]['id'])

            Dt.push(InitialData[i]['id'])

            var DataTableElement = document.createElement('li')
            DataTableElement.className = 'data-set-row'

            var DataHeader = document.createElement('div')
            DataHeader.className = 'data-header'

            var DataDescription =  document.createElement('div')
            DataDescription.className = 'data-description'
            DataDescription.innerText = InitialData[i]['create_time']

            var BoldText = document.createElement('b')
            BoldText.innerText = InitialData[i]['name']
            DataHeader.append(BoldText)

            DataHeader.value = JSON.stringify(InitialData[i])
            DataTableElement.append(DataHeader )
            DataTableElement.append(DataDescription)

            DataTableElement.draggable = 'true'

            DataTableElement.addEventListener("drag", function(event) {
                console.log("its Dragable")
            }, false)

            DataTableElement.addEventListener("dragstart", function(event) {
                // store a ref. on the dragged elem
                self.dragged = event.target;
                // make it half transparent
                // event.target.style.opacity = .5;
                }, false);

            DataTable.append(DataTableElement)
        }

        var OutPutDataSection =  this.el.querySelector('.output-file-names')


        OutPutDataSection.append(DataTable)

        return Dt
    }




async AddDataSetTable(selected_value='default', Dt=[], state='') {

    var self = this

        const options =  this.model.get('History_IDs')
        const select = document.createElement('select')
        select.id = `Data-History_IDs`  
        select.className = 'InputData'   

        for(var i = 0; i < options.length; i++) {
                const opt = `${i+1}: ${options[i]['name']}`;
                const el = document.createElement("option");
                el.textContent = opt;
                el.value =  `${options[i]['id']}`;
                select.appendChild(el);
        }

        const DataHistoryList = document.createElement('div')

        const title = document.createElement('div')
        title.className = 'history-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "galaxy-history-title"
        TitleSpan.textContent = 'Select the hiostory for available datasets'
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        DataHistoryList.append(title)

        DataHistoryList.className = "galaxy-history-list"
        DataHistoryList.append(select)

        var DataTable = document.createElement('ul')
        DataTable.className = 'galaxy-data-panel'

        DataTable.style.height = this.element.querySelector('.Galaxy-form').style.offsetHeight

        DataHistoryList.append(select)
        DataHistoryList.append(await this.data_row_list(this.model.get('GalInstance'), options[select.selectedIndex]['id']))

        select.addEventListener("change", async (event)=> {

            var ListItem = DataHistoryList.querySelector('.list-item')
            ListItem.parentNode.removeChild(ListItem)

            DataHistoryList.append(await self.data_row_list(self.model.get('GalInstance'), options[select.selectedIndex]['id']))
    
            console.log(options[select.selectedIndex]['id'])
    
                }, false);
  
        return DataHistoryList
   }


    AddHistoryList(selected_value='default') {

        var self = this

        const options =  this.model.get('History_IDs')
        const select = document.createElement('select')
        select.id = `History_IDs`  
        select.className = 'InputData'   
     
        for(var i = 0; i < options.length; i++) {
              const opt = `${i+1}: ${options[i]['name']}`;
              const el = document.createElement("option");
              el.textContent = opt;
              el.value =  `${options[i]['id']}`;
              select.appendChild(el);
        }

        if (selected_value !== 'default') {
            select.selectedIndex = selected_value
        }

        const HistoryList = document.createElement('div')

        const title = document.createElement('div')
        title.className = 'history-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "galaxy-history-title"
        TitleSpan.textContent = 'Select history'
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        HistoryList.append(title)

        HistoryList.className = "galaxy-history-list"
        HistoryList.append(select)

        select.addEventListener("change", async () => {
 
            var HistoryID = select.value

            var children = self.element.querySelector('.Galaxy-form').children;
            var Inputs = self.ReturnData(children)

            var refine_inputs  = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(${JSON.stringify(self.model.get('GalInstance'))}, ${JSON.stringify(Inputs)}, ${JSON.stringify(self.model.get('ToolID'))}, ${JSON.stringify(HistoryID)})`)

            var FormParent = self.el.querySelector('.Galaxy-form')                        
            self.removeAllChildNodes(FormParent)

            const Button = document.createElement('button')
            Button.style.display = 'none'
            Button.type = 'button'
            Button.id = 'submit'
            Button.className  = 'Galaxy-form-button'
    
            FormParent.append(Button)

            var SelectedIndex = {}
            SelectedIndex['HID'] = select.selectedIndex

            self.Main_Form(refine_inputs['inputs'],  SelectedIndex)

        });

        return HistoryList

    }

    AddHelpSection(help){

        var self = this

        var NbtoolsForm = this.element.querySelector('.nbtools-form')
        var Help = document.createElement('div')
        Help.className = 'help-section'
        var HelpContent = document.createElement('div')
        HelpContent.className = 'help-content'
        HelpContent.innerHTML = help
        HelpContent.style.display = 'none'

        this.basics.className = 'help-button-title'
        var HelpButton = document.createElement('button')
        HelpButton.className = 'help-button'
        HelpButton.textContent = 'Help Section'

        Help.append(HelpButton)
        Help.append(HelpContent)
        NbtoolsForm.append(Help)

        HelpButton.addEventListener("click", function() {

            let nextSibling = HelpButton.nextElementSibling;   


            if (nextSibling.style.display == 'none'){
                nextSibling.style.display = 'block'
            } else {
                nextSibling.style.display = 'none'
            }
          });

        return Help
    }
 

    AddRepeat(input_def, FormParent, NamePrefix) {

        var self = this
        input_def.id = this.uid()

        const InputTitle = document.createElement('div')
        InputTitle.className = 'input-title'

        const InputTitleSpan = document.createElement('span')
        InputTitleSpan.className = "ui-form-title-text"
        InputTitleSpan.textContent = input_def['title']
        InputTitleSpan.style.display = 'inline'
        InputTitle.append(InputTitleSpan)

        var Button = document.createElement('button')
        Button.innerText = `Insert ${input_def['title']}`
        Button.className = 'RepeatButton'
        Button.type = "button"
        
        const row2 = document.createElement('div')
        row2.className = 'internal-ui-repeat section-row'

        var DeleteButton = document.createElement('button')
        DeleteButton.innerHTML = ('<i class="fa fa-trash-o" aria-hidden="true"></i>')
        DeleteButton.className = 'delete-button'
        DeleteButton.type = "button"

        const row = document.createElement('div')
        const title = document.createElement('div')
        title.append(DeleteButton)
        title.className = 'repeat-ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = '1: '+input_def['title']
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        row.className = 'ui-repeat section-row'
        row.id = input_def.id
        row2.append(title)
        
        var SuffixName = input_def['name']

       for (var j in input_def['inputs']){
           this.add(input_def['inputs'][j], row2, NamePrefix+SuffixName+`_0|`)
        }
        row.append(row2)

        FormParent.append(InputTitle)
        FormParent.append(row)
        FormParent.append(Button)

        var click = 0;
        Button.addEventListener("click", function(e){ 

            const row1 = document.createElement('div')
            row1.className = 'internal-ui-repeat section-row'

            var DeleteButton = document.createElement('button')
            DeleteButton.innerHTML = ('<i class="fa fa-trash-o" aria-hidden="true"></i>')
            DeleteButton.className = 'delete-button'
            DeleteButton.type = "button"

            const InnerTitle = document.createElement('div')
            InnerTitle.className = 'repeat-ui-from-title'
            InnerTitle.append(DeleteButton)

            var Count = ++click

            const InnerTitleSpan = document.createElement('span')
            InnerTitleSpan.className = "ui-form-title-text"
            InnerTitleSpan.textContent = `${Count+1}: `+input_def['title']
            InnerTitleSpan.style.display = 'inline'
            InnerTitle.append(InnerTitleSpan)

            row1.append(InnerTitle)

            DeleteButton.addEventListener("click", function(e){ 

                self.el.querySelector('.delete-button').closest('.internal-ui-repeat.section-row').remove()
    
            });

             e.preventDefault(); //self.AddRepeat(input_def, FormParent, NamePrefix)
             for (var j in input_def['inputs']){
                self.add(input_def['inputs'][j], row1, NamePrefix+SuffixName+`_${Count}|`)
             } 

             row.append(row1)
         
        });

        DeleteButton.addEventListener("click", function(e){ 

            self.el.querySelector('.delete-button').closest('.internal-ui-repeat.section-row').remove()

        });

        return row
    }
 
     removeAllChildNodes(parent) {
         while (parent.firstChild) {
             parent.removeChild(parent.firstChild);
         }
     }


    FileUpLoad (input_def, FormParent, NamePrefix, call_back_data={}) {    
        
        input_def.id = this.uid()
        var self = this

        const row = document.createElement('div')
        row.className = 'ui-form-element section-row'
        row.id = input_def.id

        var SingleFile = document.createElement('li')
        SingleFile.className = "fa fa-file-o no-paddin"

        var MultFiles = document.createElement('li')
        MultFiles.className = 'fa fa-files-o no-paddin'

        var Collection = document.createElement('li')
        Collection.className = 'fa fa-folder-o no-padding'

        var Label_file = document.createElement('label')
        Label_file.style.width = '5px'
        Label_file.id = 'label-1'
        Label_file.className = 'ui-option'
        Label_file.append(SingleFile)
        Label_file.style.display = 'none'

        var Label_files = document.createElement('label')
        Label_files.style.width = '5px'
        Label_files.id = 'label-2'
        Label_files.className = 'ui-option'
        Label_files.append(MultFiles)
        Label_files.style.display = 'none'
        Label_files.style.backgroundColor = 'rgb(133, 131, 120)'

        var Label_collection = document.createElement('label')
        Label_collection.style.width = '5px'
        Label_collection.id = 'label-3'
        Label_collection.className = 'ui-option'
        Label_collection.append(Collection)
        Label_collection.style.display = 'none'

        var FileManu = document.createElement('div')

        FileManu.className = 'multi-selectbox'

        FileManu.append(Label_files)
        FileManu.append(Label_collection)

        FileManu.style.width = '100%'
        FileManu.style.float = 'left'

        var Select = document.createElement('select')
        Select.className = 'selectbox-scrollable'

        Select.style.width = '100%'

        if (input_def.multiple == true ){
            Select.multiple = true
            Select.style.height = '200px'
        }

        Select.name = NamePrefix+input_def['name']

        var options = input_def.options

        Select.ondrop="drop(event)"
        Select.ondragover="allowDrop(event)"

        const title = document.createElement('div')
        title.className = 'ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)

        for (var i = 0; i < options['hda'].length; i++) {
            Select.insertAdjacentHTML('beforeend', `
            <option  value="${options['hda'][i]['id']}">${options['hda'][i].name}</option>
          `)
        }

        if (call_back_data['RecCall'] == true) {

            for(var i =0; i < Select.options.length; i++) {
                    for(var k = 0; k < input_def.value.values.length; k++ ) {                    
                    if (Select.options[i].value == input_def.value.values[k]['id']){
                        Select.options[i].selected = true
                    }
                }
            }

        } 


        Select.addEventListener("dragover", function(event) {
            // prevent default to allow drop
            event.preventDefault();
            console.log('its Drag over')
        }, false);

        Select.addEventListener("drop", function(event) {
            // prevent default action (open as link for some elements)
            event.preventDefault();
            // move dragged elem to the selected drop target
            console.log(event.target.className)
            if (event.target.className == "selectbox-scrollable") {

                event.target.style.background = "";
                //   dragged.parentNode.removeChild( dragged );
                //   event.target.appendChild( dragged );

                var draged_item = self.dragged.firstElementChild
                // self.removeAllChildNodes(Select)

                const opt = JSON.parse(draged_item.value)['name']
                const el = document.createElement("option");
                el.textContent = opt;
                el.value = `${JSON.parse(draged_item.value)['id']}` //Fix me 

                Select.appendChild(el);
            }
        }, false);

        var children = self.element.querySelector('.Galaxy-form').children;
        var Inputs = self.ReturnData(children)

        row.append(title)
        FileManu.append(Select)

        row.append(FileManu)

        if (input_def.multiple === true ){

            Label_files.style.display = 'block'
            Label_collection.style.display = 'block'
            Select.multiple = true
        }

        row.querySelectorAll('.ui-option').forEach((Label) => Label.addEventListener('click', () => {

            console.log('ok')

            if (Label.id == 'label-2'){
                Label_files.style.backgroundColor = 'rgb(133, 131, 120)'
                Label_collection.style.backgroundColor = 'white'

            } else if (Label.id == 'label-3') {
                Label_collection.style.backgroundColor = 'rgb(133, 131, 120)'
                Label_files.style.backgroundColor = 'white'
    
            } else {
                Select.multiple = false
                UploadFileLabel.style.display = 'block'

            }
        

        }));
        
        FileManu.style.width = '100%'

        row.append(FileManu)
        
        Select.addEventListener("change", async () => {

            var self  = this;

            var children = self.el.querySelector('.Galaxy-form').children;
        
            var Inputs = self.ReturnData(children)

            var HistoryID = self.element.querySelector('#History_IDs').value
            var refine_inputs  = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(${JSON.stringify(self.model.get('GalInstance'))}, ${JSON.stringify(Inputs)}, ${JSON.stringify(self.model.get('ToolID'))}, ${JSON.stringify(HistoryID)})`)
    
            const Button = document.createElement('button')
            Button.style.display = 'none'
            Button.type = 'button'
            Button.id = 'submit'
            Button.className  = 'Galaxy-form-button'

            var FormParent = self.el.querySelector('.Galaxy-form')
            FormParent.append(Button)

            var HID = self.element.querySelector('#History_IDs')
            self.removeAllChildNodes(FormParent)

            var CallBackData =  self.ReturnDataFiles(Select)
            CallBackData['HID'] = HID.selectedIndex
            CallBackData['RecCall'] = true
    
            self.Main_Form(refine_inputs['inputs'], CallBackData)

            }, false);

            FormParent.append(row)
            return row
    }


    AddInteger (input_def, FormParent, NamePrefix) {

        input_def.id = this.uid()
        const input = document.createElement('input')
        input.value = input_def['value']
        input.className = 'InputData'
        input.name = NamePrefix+input_def['name']
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
        FormParent.append(row)
        
        return row
    }
 
 
    AddFloat (input_def, FormParent, NamePrefix) {

        input_def.id = this.uid()
        const input = document.createElement('input')
        input.value = input_def['value']
        input.name = NamePrefix+input_def.name
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
        FormParent.append(row)
        return row
    }
 
    AddConditionalSelectField (input_def, ElID, NamePrefix, call_back_data={} ) {

        input_def.id = this.uid()
        var self = this

        const options =  input_def['test_param']['options']
        const select = document.createElement('select')
        select.name = NamePrefix+input_def['name']+"|"+input_def['test_param']['name']

        select.id = `select-${input_def.id}`    
        select.className = 'InputData' 
    
        for(var i = 0; i < options.length; i++) {
            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = options[i][1];
            select.appendChild(el);
        }

        for(var i, j = 0; i = select.options[j]; j++) {
            if(i.value == input_def.test_param.value) {
                select.selectedIndex = j;
                break;
            }
        }
    
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
        
        select.addEventListener("change", async () => {

            var queryID = select.value

            for (var i in ElID) {
    
                if (options[i][1] == queryID ) {
                    this.el.querySelector(`#${ElID[i]}`).style.display = 'block'
                } 
                else {
                    this.el.querySelector(`#${ElID[i]}`).style.display = 'none'
                }
            }

        var children = self.element.querySelector('.Galaxy-form').children;
        var Inputs = self.ReturnData(children)

        var HistoryID = self.element.querySelector('#History_IDs').value 
        var refine_inputs   = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(${JSON.stringify(self.model.get('GalInstance'))}, ${JSON.stringify(Inputs)}, ${JSON.stringify(self.model.get('ToolID'))}, ${JSON.stringify(HistoryID)})`)

        var FormParent = self.el.querySelector('.Galaxy-form')
        self.removeAllChildNodes(FormParent)

        const Button = document.createElement('button')
        Button.style.display = 'none'
        Button.type = 'button'
        Button.id = 'submit'
        Button.className  = 'Galaxy-form-button'

        FormParent.append(Button)
        self.Main_Form(refine_inputs['inputs'], call_back_data);
    
        });

        return row
    }
 
 
    AddSelectField (input_def, FormParent, NamePrefix) {

        input_def.id = this.uid()
        var self = this

        const Div = document.createElement('div')
        const row = document.createElement('div')

        if (input_def.display== 'checkboxes') {

            const title = document.createElement('div')
            title.className = 'ui-from-title'
            const TitleSpan = document.createElement('span')
            TitleSpan.className = "ui-form-title-text"
            TitleSpan.textContent = input_def['label']

            title.append(TitleSpan)
            Div.append(title)

            for(var i = 0; i < input_def.options.length; i++) {
                const CheckBox = document.createElement('input')
                CheckBox.className = 'ui-checkbox'
                CheckBox.id = `select-${input_def.id}-${i}`
                const Label = document.createElement('label')
                Label.htmlFor = `select-${input_def.id}-${i}`
                Label.innerText = input_def.options[i][0]
                
                CheckBox.type = 'checkbox'
                Div.append(CheckBox)
                Div.append(Label)
            }

            row.append(Div)
        
        } else {

            const options =  input_def['options']
            const select = document.createElement('select')
            select.id = `select-${input_def.id}`  
            select.className = 'InputData'   
            select.name = NamePrefix+input_def['name']
        
            for(var i = 0; i < options.length; i++) {
                const opt = options[i][0];
                const el = document.createElement("option");
                el.textContent = opt;
                el.value =  options[i][1];
                select.appendChild(el);
            }

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
            });
        }

        FormParent.append(row)

        return row
    }


    TestAddSelectField (input_def, FormParent, NamePrefix) {

        input_def.id = this.uid()
        var self = this

        const options =  input_def['options']['hda']
        const select = document.createElement('select')
        select.id = `select-${input_def.id}`  
        select.className = 'InputData'   
        select.name = NamePrefix

        console.log(options)
    
        for(var i = 0; i < options.length; i++) {
            const opt = options[i]['name'];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value =  options[i]['id'];
            select.appendChild(el);
        }

        const title = document.createElement('div')
        title.className = 'ui-from-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def['label']

        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)

        select.addEventListener("change", () => {

            var queryID = select.value
        });
   
        return select
    }
 
 
    AddBooleanField (input_def, FormParent, NamePrefix ) {

        input_def.id = this.uid()

        const options =  [['True', 'True', 'True'],
                        ['False', 'False', 'False']]

        const select = document.createElement('select')

        select.name = NamePrefix+input_def['name']

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
        FormParent.append(row)
        return row
    }

    collect_data(){
        const Childrens  = this.el.querySelector('.nbtools-form').children;
    }
 
 
    AddConditoinalSection2 (input_def, parent, NamePrefix, call_back_data={}) {

        var NewNamePrefix = NamePrefix+input_def['name']+"|"
        input_def.id = this.uid()

        const ElementIDs = []

        for (var e in input_def.cases) {
            ElementIDs.push(`${input_def.id}-section-${e}`)
        }

        const Selectfiled = this.AddConditionalSelectField(input_def, ElementIDs, NamePrefix)

        parent.append(Selectfiled)

        var ConditionalDiv

        for (var i in input_def['test_param']['options']) {

            ConditionalDiv = document.createElement('div')
            ConditionalDiv.className = 'ui-form-element section-row pl-2'
            ConditionalDiv.id = `${ElementIDs[i]}`
            if (input_def.test_param.value == input_def.test_param.options[i][1]){
            ConditionalDiv.style.display = 'block'

            } else {
            ConditionalDiv.style.display = 'none'
            }


        for (var l in input_def.cases){
            
            if  (input_def.cases[l].value == input_def['test_param']['options'][i][1]) {
    
                for (var j in input_def.cases[l].inputs) {

                    this.add(input_def.cases[l].inputs[j], ConditionalDiv, NewNamePrefix, call_back_data)
                    
                    input_def.cases[l].inputs[j].id = this.uid()
        
                }
            }
        }

        parent.append(ConditionalDiv)
        }
    }

    AddSection (input_def, parent, NamePrefix) {

        var self = this
        var NewNamePrefix = NamePrefix+input_def['name']+"|"
        input_def.id = this.uid()

        const UpperDiv = document.createElement('div')
        UpperDiv.className = `ui-portlet-section section-row`
        UpperDiv.id = `${input_def.id}`

        const Button = document.createElement('button')
        Button.className = 'collapsible'
        Button.innerText = input_def['title']

        var ConditionalDiv  = document.createElement('div')
        UpperDiv.appendChild(Button)

        ConditionalDiv.className = `ui-form-element section-row sections`
        ConditionalDiv.id = `${input_def.id}-sections`

        UpperDiv.append(ConditionalDiv)

        for (var j in input_def['inputs']){
            this.add(input_def['inputs'][j] ,ConditionalDiv , NewNamePrefix)
        }

        if (input_def.expanded == true) {
            ConditionalDiv.style.display = 'block';  
        } else  {
            ConditionalDiv.style.display = 'none'; 
        }

        parent.append(UpperDiv)

        Button.addEventListener("click", function(e) {
            e.preventDefault();
            let nextSibling = Button.nextElementSibling;   

            if (nextSibling.style.display == 'none'){
                nextSibling.style.display = 'block'
            } else {
                nextSibling.style.display = 'none'
            }
        });
    }

   waitforme(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
    }

    async data_row_list (GalInstance, HistoryID) {

        var DataList = document.createElement('ul')
        DataList.className = 'list-item'
        DataList.style.overflow = 'auto'
        DataList.style.height = '400px'
        DataList.style.overflowX = 'scroll'
        DataList.style.overflowY = 'scroll'
    
        var datasets = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.history_data_list(GalInstance=${JSON.stringify(GalInstance)}, HistoryID=${JSON.stringify(HistoryID)} )`) 

    
        for (var i = 0; i < datasets.length; i++){
            if (datasets[i]['state']=='ok') {
               DataList.append( await this.dataset_row_ok_state(datasets[i]))
            }
            else if (datasets[i]['state']=='error') {
                DataList.append(await this.dataset_row_error_state(datasets[i]))
            }
        }
        
    
        return DataList
    }
    
    async dataset_row_ok_state (dataset){

        var URL = this.model.get('GalInstance')['URL']
        
        var row = `<div id="dataset-${dataset['dataset_id']}" class="list-item dataset history-content state-ok">
                    <div class="warnings"></div>
                    <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                    <div class="primary-actions"><a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                    <div class="title-bar clear" tabindex="0" draggable="true"> <span class="state-icon"></span>
                        <div class="title"> <span class="hid">${dataset['hid']}</span> <span class="name">${dataset['name']}</span> </div>
                        <br>
                        <div title="0 nametags" class="nametags"></div>
                    </div>

                </div>`
        
        const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector('.list-item.dataset.history-content.state-ok')

        Tbl.addEventListener('click', async (e) => {

            if (Tbl.querySelector('.details') == null ){
                var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(dataset['id'])} )`) 
                console.log(show_dataset)
                var error_details = await this.dataset_ok_details(show_dataset)
                Tbl.append(error_details)
            }

            if (Tbl.querySelector('.details').style.display == 'block') {
                Tbl.querySelector('.details').style.display = 'none'
            } else{
                Tbl.querySelector('.details').style.display = 'block'
            }
        });

        return Tbl
    } 
    
    async dataset_row_error_state (dataset)  {

        var URL = this.model.get('GalInstance')['URL']

        var row = `<div id="dataset-${dataset['dataset_id']}" class="list-item dataset history-content state-error">
                        <div class="warnings"></div>
                        <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                        <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${dataset['dataset_id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                        <div class="title-bar clear" tabindex="0" draggable="true"> <span class="state-icon"></span>
                            <div class="title"> <span class="hid">${dataset['hid']}</span> <span class="name">${dataset['name']}</span> </div>
                            <br>
                            <div title="0 nametags" class="nametags"></div>
                        </div>

                    </div>`

        const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector('.list-item.dataset.history-content.state-error')
        
        Tbl.addEventListener('click', async (e) => {

            if (Tbl.querySelector('.details')  == null){
                var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(dataset['id'])} )`) 
                var error_details = await this.dataset_error_details(show_dataset)
                Tbl.append(error_details)
            }

            if (Tbl.querySelector('.details').style.display == 'block') {
                Tbl.querySelector('.details').style.display = 'none'
            } else{
                Tbl.querySelector('.details').style.display = 'block'
            }
        });

        return Tbl
    }

    async dataset_error_details(dataset){

        var URL = this.model.get('GalInstance')['URL']

        var details =  `<div class="details" style="display: none;">
                        <div class="summary">
                            <div class="detail-messages">${dataset['misc_blurb']}</div>
                            <div>error</div>
                            <span class="help-text">An error occurred with this dataset:</span>
                            <div class="job-error-text"> ${dataset['misc_info']} </div>
                        </div>
                        <div class="actions clear">
                            <div class="left"><a class="icon-btn report-error-btn" title="" href="${URL}/datasets/error?dataset_id=${dataset['dataset_id']}" data-original-title="View or report this error"><span class="fa fa-bug" style=""></span></a><a class="icon-btn params-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn rerun-btn" title="" target="galaxy_main" href="${URL}/tool_runner/rerun?id=${dataset['dataset_id']}" data-original-title="Run this job again"><span class="fa fa-refresh" style=""></span></a><a class="icon-btn icon-btn" title="" href="#" data-original-title="Tool Help"><span class="fa fa-question" style=""></span></a></div>
                            <div class="right"><a class="icon-btn tag-btn" title="" href="javascript:void(0);" data-original-title="Edit dataset tags"><span class="fa fa-tags" style=""></span></a><a class="icon-btn annotate-btn" title="" href="#" data-original-title="Edit dataset annotation"><span class="fa fa-comment" style=""></span></a></div>
                        </div>

                        <div class="annotation-display"></div>
                        <div class="display-applications"></div>
                    </div>
                `

        const error_details_html = new DOMParser().parseFromString(details, 'text/html').querySelector('.details')

        return error_details_html
    }

    async dataset_row_queued_state(dataset){

    var URL = this.model.get('GalInstance')['URL']

    var row =   `<div id="dataset-${dataset['dataset_id']}-queued" class="list-item dataset history-content state-queued" style="display: block;">
                    <div class="warnings"></div>
                    <div class="selector"><span class="fa fa-clock-o"></span></div>
                    <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${dataset['dataset_id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="#" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                    <div class="title-bar clear" tabindex="0" draggable="true"> <span class="fa fa-clock-o"></span>
                        <div class="title"> <span class="hid">${dataset['hid']}</span> <span class="name">${dataset['name']}</span> </div>
                        <br>
                        <div class="nametags"></div>
                    </div>
                    <div class="details" style="display: none;">
                        <div class="summary">
                            <div class="detail-messages"></div>
                            <div>This job is waiting to run</div>
                        </div>
                        <div class="actions clear">
                            <div class="left"><a class="icon-btn params-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn rerun-btn" title="" target="galaxy_main" href="${URL}/tool_runner/rerun?id=${dataset['dataset_id']}" data-original-title="Run this job again"><span class="fa fa-refresh" style=""></span></a><a class="icon-btn icon-btn" title="" href="#" data-original-title="Tool Help"><span class="fa fa-question" style=""></span></a></div>
                            <div class="right"><a class="icon-btn tag-btn" title="" href="" data-original-title="Edit dataset tags"><span class="fa fa-tags" style=""></span></a><a class="icon-btn annotate-btn" title="" href="" data-original-title="Edit dataset annotation"><span class="fa fa-comment" style=""></span></a></div>
                        </div>
                        
                        <div class="annotation-display"></div>
                        <div class="display-applications"></div>
                    </div>
                </div>`

    const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector('.list-item.dataset.history-content.state-queued')

    Tbl.addEventListener('click', async (e) => {

        if (Tbl.querySelector('.details')  == null){
            var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(dataset['id'])} )`) 
            var error_details = await this.dataset_error_details(show_dataset)
            Tbl.append(error_details)
        }

        if (Tbl.querySelector('.details').style.display == 'block') {
            Tbl.querySelector('.details').style.display = 'none'
        } else{
            Tbl.querySelector('.details').style.display = 'block'
        }
    });

    return Tbl


    }

    async dataset_ok_details(dataset){

        var URL = this.model.get('GalInstance')['URL']

        var details =  ` <div class="details" style="display: none;">
                            <div class="summary">
                                <div class="detail-messages"></div>
                                <div class="blurb"><span class="value">${dataset['misc_blurb']}</span></div>
                                <div class="datatype">
                                    <label class="prompt">format</label><span class="value">${dataset['extension']}</span>
                                </div>
                                <div class="dbkey">
                                    <label class="prompt">database</label><span class="value">${dataset['metadata_dbkey']}</span>
                                </div>
                                <div class="info"><span class="value">${dataset['misc_info']} </span></div>
                            </div>
                            <div class="actions clear">
                                <div class="left">
                                    <a class="download-btn icon-btn" href="${URL}/datasets/${dataset['id']}/display?to_ext=${dataset['extension']}" title="" data-original-title="Download"> <span class="fa fa-save"></span> </a><a class="icon-btn" title="" href="" data-original-title="Copy link"><span class="fa fa-chain" style=""></span></a><a class="icon-btn params-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn visualization-link" title="" href="${URL}/visualizations?dataset_id=${dataset['dataset_id']}" data-original-title="Visualize this data"><span class="fa fa-bar-chart" style=""></span></a><a class="icon-btn icon-btn" title="" href="#" data-original-title="Tool Help"><span class="fa fa-question" style=""></span></a>
                                </div>
                            </div>

                            <div class="annotation-display"></div>

                            <div class="display-applications">
                                <div class="display-application"><span class="display-application-location">display in IGB</span> <span class="display-application-links"><a target="_blank" href="/display_application/${dataset['dataset_id']}/igb_bed/View">View</a> </span></div>
                                <div class="display-application"><span class="display-application-location">display with IGV</span> <span class="display-application-links"><a target="_blank" href="/display_application/${dataset['dataset_id']}/igv_interval_as_bed/local_default">local</a> <a target="_blank" href="/display_application/${dataset['dataset_id']}/igv_interval_as_bed/hg38">Human hg38</a> </span></div>
                                <div class="display-application"><span class="display-application-location">display at UCSC</span> <span class="display-application-links"><a target="_blank" href="/datasets/942/display_at/ucsc_main?redirect_url=http%3A%2F%2Fgenome.ucsc.edu%2Fcgi-bin%2FhgTracks%3Fdb%3Dhg38%26position%3Dchr1%3A11868-827796%26hgt.customText%3D%25s&amp;display_url=http%3A%2F%2F127.0.0.1%3A8080%2Froot%2Fdisplay_as%3Fid%3D942%26display_app%3Ducsc%26authz_method%3Ddisplay_at">main</a> <a target="_blank" href="/datasets/942/display_at/ucsc_test?redirect_url=http%3A%2F%2Fgenome-test.gi.ucsc.edu%2Fcgi-bin%2FhgTracks%3Fdb%3Dhg38%26position%3Dchr1%3A11868-827796%26hgt.customText%3D%25s&amp;display_url=http%3A%2F%2F127.0.0.1%3A8080%2Froot%2Fdisplay_as%3Fid%3D942%26display_app%3Ducsc%26authz_method%3Ddisplay_at">test</a> </span></div>
                            </div><pre class="dataset-peek"> ${dataset['peek']} </pre></div>
                        </div>
                       `

        const ok_details_html = new DOMParser().parseFromString(details, 'text/html').querySelector('.details')

        return ok_details_html
    }

    async dataset_row_running_state (dataset) {
        
        var URL = this.model.get('GalInstance')['URL']
        
            var row = `<div id="dataset-${dataset['dataset_id']}" class="list-item dataset history-content state-running" >
                            <div class="warnings"></div>
                            <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                            <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${dataset['dataset_id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                            <div class="title-bar clear" tabindex="0" draggable="true"> <span class="state-icon"></span>
                                <div class="title"> <span class="hid">${dataset['hid']}</span> <span class="name">${dataset['name']}</span> </div>
                                <br>
                                <div class="nametags"></div>
                            </div>
                            <div class="details" style="display: none;">
                                <div class="summary">
                                    <div class="detail-messages"></div>
                                    <div>This job is currently running</div>
                                </div>
                                <div class="actions clear">
                                    <div class="left"><a class="icon-btn params-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn rerun-btn" title="" target="galaxy_main" href="${URL}/tool_runner/rerun?id=${dataset['dataset_id']}" data-original-title="Run this job again"><span class="fa fa-refresh" style=""></span></a><a class="icon-btn icon-btn" title="" href="#" data-original-title="Tool Help"><span class="fa fa-question" style=""></span></a></div>
                                    <div class="right"><a class="icon-btn tag-btn" title="" href="javascript:void(0);" data-original-title="Edit dataset tags"><span class="fa fa-tags" style=""></span></a><a class="icon-btn annotate-btn" title="" href="javascript:void(0);" data-original-title="Edit dataset annotation"><span class="fa fa-comment" style=""></span></a></div>
                                </div>
                            
                                <div class="annotation-display"></div>
                                <div class="display-applications"></div>
                            </div>
                        </div>`
            const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector('.list-item.dataset.history-content.state-running')
        
            Tbl.addEventListener('click', (e) => {
        
                if (Tbl.querySelector('.details').style.display == 'block') {
                    Tbl.querySelector('.details').style.display = 'none'
                } else{
                    Tbl.querySelector('.details').style.display = 'block'
                }
            })
        
            return Tbl
        }
    
    async dataset_row_new_state  (dataset) {

           var URL = this.model.get('GalInstance')['URL']
        
            var row = `<div id="dataset-${dataset['dataset_id']}" class="list-item dataset history-content state-running" style="display: none;">
                            <div class="warnings"></div>
                            <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                            <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${dataset['dataset_id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                            <div class="title-bar clear" tabindex="0" draggable="true"> <span class="state-icon"></span>
                                <div class="title"> <span class="hid">${dataset['hid']}</span> <span class="name">${dataset['name']}/span> </div>
                                <br>
                                <div class="nametags"></div>
                            </div>
                            <div class="details" style="display: block;">
                                <div class="summary">
                                    <div class="detail-messages"></div>
                                    <div>This job is currently running</div>
                                </div>
                                <div class="actions clear">
                                    <div class="left"><a class="icon-btn params-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn rerun-btn" title="" target="galaxy_main" href="${URL}/tool_runner/rerun?id=${dataset['dataset_id']}" data-original-title="Run this job again"><span class="fa fa-refresh" style=""></span></a><a class="icon-btn icon-btn" title="" href="#" data-original-title="Tool Help"><span class="fa fa-question" style=""></span></a></div>
                                    <div class="right"><a class="icon-btn tag-btn" title="" href="" data-original-title="Edit dataset tags"><span class="fa fa-tags" style=""></span></a><a class="icon-btn annotate-btn" title="" href="" data-original-title="Edit dataset annotation"><span class="fa fa-comment" style=""></span></a></div>
                                </div>
                                <div class="annotation-display"></div>
                                <div class="display-applications"></div>
                            </div>
                        </div>`
        
            const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector('.list-item.dataset.history-content.state-error')
        
            return Tbl
        }
    
    async attach_event  (Node, className) { 

            var DataSets = Node.querySelectorAll(className)
        
            DataSets.forEach((button) => button.querySelector('.title').addEventListener('click', (e) => {
        
                if (button.querySelector('.details').style.display == 'block') {
                    button.querySelector('.details').style.display = 'none'
                } else{
                    button.querySelector('.details').style.display = 'block'
                }
        
            }));
        
    }
    
    async AddJobStatusWidget(Inputs, HistoryID) {

        this.JobStatusTemplate(HistoryID)
        this.hide_run_buttons(true)

        var job  = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.submit_job(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, Tool_inputs=${JSON.stringify(Inputs)}, HistoryID=${JSON.stringify(HistoryID)})`)

        var OutFileName = this.el.querySelector('.job-output-files')
        OutFileName.append(await this.input_output_file_name(job))

        this.el.querySelector('.job-id').innerText = 'Job ID : '+ job['id']
        this.el.querySelector('.job-detail-text-name').innerText = 'Submitted by : '+ job['user_email']+' on '+ job['update_time']

        var DHL = this.el.querySelector('.galaxy-history-list')
        var ListItem =  this.el.querySelector('.list-item')

        DHL.removeChild(ListItem)

       for (var i = 0; i <  DHL.querySelector('#Data-History_IDs').length; i++ ){
            if (DHL.querySelector('#Data-History_IDs')[i].value == HistoryID) {
                DHL.querySelector('#Data-History_IDs').selectedIndex = i
            }
        }

        DHL.append(await this.data_row_list(this.model.get('GalInstance'), HistoryID))

        var states = ['ok', 'error']
        for (let i = 0; i < Infinity; ++i) {

            // var os = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.TestOut(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, JobID=${JSON.stringify(job['id'])} )`);

            var data = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.OutPutData(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, JobID=${JSON.stringify(job['id'])} )`);
            var JobState = data[0]['state']
            var ListItem =  this.el.querySelector('.list-item')

            if (JobState=='running'){
                var gearrotate = this.el.querySelector('.gear-rotate-icon')
                gearrotate.style.display = 'block'

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Job Running'
                JobDoneText.style.color = '#F5A207'

                for (var j =0; j < data.length; j++){

                    var id=`dataset-${data[j]['dataset_id']}-queued`

                    if(ListItem.querySelector(`#${id}`) !== null){
                        var e = ListItem.querySelector(`#${id}`)
                        e.parentElement.removeChild(e)
                    }

                    if (ListItem.querySelector(`#dataset-${data[j]['dataset_id']}`) == null ) {
                        ListItem.prepend(await this.dataset_row_running_state(data[j]))
                    }
                }

            } else if (['queued', 'new'].includes(JobState)) {

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Job queued'

                for (var j =0; j < data.length; j++){

                    if (ListItem.querySelector(`#dataset-${data[j]['dataset_id']}`) == null ) {
                        ListItem.prepend(await this.dataset_row_queued_state(data[j]))
                    }
                }

            } else if (JobState == 'ok'){


                for (var j =0; j < data.length; j++){
                    var id=`dataset-${data[j]['dataset_id']}`

                    if ( ListItem.querySelector(`#${id}`) !== null) {
                        var e = ListItem.querySelector(`#${id}`)
                        e.parentElement.removeChild(e)
                    }

                    ListItem.prepend(await this.dataset_row_ok_state(data[j]))
                }

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Job queued'

                var gearrotate = this.el.querySelector('.gear-rotate-icon')
                gearrotate.style.display = 'none'

                var gearrotate = this.el.querySelector('.job-done-icon')
                gearrotate.style.display = 'block'

            } else if (JobState == 'error'){

                for (var j =0; j < data.length; j++){

                    var id=`dataset-${data[j]['dataset_id']}`

                    if ( ListItem.querySelector(`#${id}`) !== null) {
                        var e = ListItem.querySelector(`#${id}`)
                        e.parentElement.removeChild(e)
                    }
        
                    ListItem.prepend(await this.dataset_row_error_state(data[j]))
      
                 }

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Fatal Error'
                JobDoneText.style.color = 'white'

                var gearrotate = this.el.querySelector('.gear-rotate-icon')
                gearrotate.style.display = 'none'

                var gearrotate = this.el.querySelector('.job-error-icon')
                gearrotate.style.display = 'block'

                var StdError  = this.el.querySelector('.job-output-files')
                // StdError.style.background  = 'black'

                // StdError.innerText = os['stderr'];
                // StdError.style.overflow = 'scroll';
                // StdError.style.background= 'black';
                // StdError.style.color = 'white';
            }

            await this.waitforme(5000);

            if (states.includes(JobState) === true ) {
                break;
            }      
        }
    }

    JobStatusTemplate(HistoryID){

        var self = this

        var JobStatus = `<div class="form">    
                        <div class="job-status-widget">

                            <div class="job-header">
                                <div class="indicator">

                                    <div class="gear-rotate-icon">
                                        <div class="gear-rotate">
                                        </div>
                                    </div>

                                    <div class=job-done-icon>
                                        <i class="fa fa-check-circle"></i>
                                    </div>

                                    <div class=job-error-icon>
                                        <i class="fa fa-times-circle"></i>
                                    </div>

                                </div>

                                <div class="job-done-text">
                                    <div class="job-state-text">
                                        Job Complete
                                    </div>
                                </div> 
                                
                                <div class=job-status>
                                    <div class="job-id">
                                        Job ID : 934928374hf
                                    </div>
                                </div>

                                <div class="tool-form-reset">
                                    <button class="rbtn"><i class="fa fa-refresh"></i></button>
                                </div>
                                
                            </div>

                            <div class="job-output-files">
 
                            </div>

                            <div class="job-footer">
                                <div class=job-details>
                                    <div class="job-detail-text-name">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`

            const Job = new DOMParser().parseFromString(JobStatus, 'text/html').querySelector('.job-status-widget')

            var GBody = this.el.querySelector('.nbtools-form')
            var toolForm = this.el.querySelector('.Galaxy-form')
            var Help = this.el.querySelector('.help-section')

            GBody.removeChild(toolForm)
            GBody.removeChild(Help)

            toolForm.style.backgroundColor = 'white'
            // toolForm.style.height = '300px';
    
            this.removeAllChildNodes(toolForm)

            GBody.append(Job)
            

            var BTN = this.el.querySelector('.rbtn')

            BTN.addEventListener('click', async (e) => {


                var refine_inputs  = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(GalInstance=${JSON.stringify(self.model.get('GalInstance'))}, toolID=${JSON.stringify(self.model.get('ToolID'))}, HistoryID=${JSON.stringify(HistoryID)})`)
                
                var toolForm = self.el.querySelector('.Galaxy-form')
                self.removeAllChildNodes(toolForm)
                self.Main_Form(refine_inputs['inputs'])
                self.hide_run_buttons()
            } );
    }



    async input_output_file_name(job) {

        var Table = `<div class="donemessagelarge">
                        <p> Executed <b>${this.model.get('GalInstance')['tool_name']}</b> and successfully added 1 job to the queue. </p>
                        <p>The tool uses this input:</p>
                        <ul class="inputs">
                        </ul>
                        <p>It produces this output:</p>
                        <ul class=outputs>
                        </ul> 

                        <p> You can check the status of queued jobs and view the resulting data by refreshing the History panel. When the job has been run the status will change from 'running' to 'finished' if completed successfully or 'error' if problems were encountered. </p>
                    </div>
                    `

        var JobPanel = new DOMParser().parseFromString(Table, 'text/html').querySelector('.donemessagelarge')

        var inputs = JobPanel.querySelector('.inputs')
        var outputs = JobPanel.querySelector('.outputs')

        for (var j =0; j < Object.keys(job['inputs']).length; j++){
            console.log(Object.keys(job['inputs']))
            var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(job['inputs'][Object.keys(job['inputs'])[j]]['id'])} )`) 
            var ILi  = document.createElement('li')
            var Ib = document.createElement('b')
            Ib.innerText = `${show_dataset['name']}`
            ILi.append(Ib)
            inputs.append(ILi)
        }

        for (var k =0; k < Object.keys(job['outputs']).length; k++){
            console.log(Object.keys(job['outputs']))
            var OLi  = document.createElement('li')
            var Ob = document.createElement('b')
            var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(job['outputs'][Object.keys(job['outputs'])[k]]['id'])} )`) 
            Ob.innerText =  `${show_dataset['name']}`
            OLi.append(Ob)
            outputs.append(OLi)
            }

    return JobPanel
    }

     //#############################################################################
     
     busy_changed() {
         const display = this.model.get('busy') ? 'block' : 'none';
         this.element.querySelector('.nbtools-busy').style.display = display;
     }
     display_header_changed() {
         const display = this.model.get('display_header') ? 'block' : 'none';
         this.element.querySelector('.nbtools-buttons:first-of-type').style.display = display;
         this.element.querySelector('.nbtools-description').style.display = display;
     }
     display_footer_changed() {
         const display = this.model.get('display_footer') ? 'block' : 'none';
         this.element.querySelector('.nbtools-buttons:last-of-type').style.display = display;
         this.element.querySelector('.nbtools-footer').style.display = display;
         // If there is an output_var element, hide or show it as necessary
         if (!this.output_var_displayed())
             return;
         this.element.querySelector('.nbtools-input:last-of-type').style.display = display;
     }
     output_var_displayed() {
         const output_var = this.model.get('_parameters')['output_var'];
         return !!(output_var && output_var['hide'] == false);
     }
     activate_custom_buttons() {
         this.el.querySelectorAll('.nbtools-buttons').forEach((box) => {
             const buttons = this.model.get('buttons');
             Object.keys(buttons).forEach((label) => {
                 const button = new DOMParser().parseFromString(`<button>${label}</button>`, "text/html")
                     .querySelector('button');
                 const button_event = new Function(buttons[label]);
                 button.addEventListener('click', button_event);
                 box.prepend(button);
             });
         });
     }
     /**
      * Attach the click event to each Run button
      */
      activate_run_buttons() {
 
         var self  = this;
         this.el.querySelectorAll('.nbtools-run').forEach((button) => button.addEventListener('click', () => {
             // Validate required parameters and return if not valid
             if (!this.validate())
                 return;


            var HistoryID = self.element.querySelector('#History_IDs').value 
            var children = self.element.querySelector('.Galaxy-form').children;
            var Inputs = self.ReturnData(children)

            this.AddJobStatusWidget(Inputs, HistoryID)


            //  if (this.model.get('collapse'))
            //      this.el.querySelector('.nbtools-collapse').click();
         }));
     }


     hide_run_buttons(hide) {
        var self  = this;
        this.el.querySelectorAll('.nbtools-run').forEach((button) =>{
            if (hide == true){
                button.style.display = 'none';
            } else { 
                button.style.display = 'block';
            }
        });
    }


     /**
      * Check to make sure required parameters are checked out.
      * Highlight missing parameters. Return whether valid.
      */
     validate() {
         let valid = true;
         const form = this.el.querySelector('.nbtools-form');
         form.querySelectorAll('.nbtools-input').forEach((param) => {
             if (!param.classList.contains('required'))
                 return; // Ignore optional parameters
             const input = param.querySelector('input, select');
             if (input.value.trim() === '') { // If empty
                 param.classList.add('missing'); // Add missing style
                 valid = false; // Not all params are valid
             }
             else
                 param.classList.remove('missing'); // Remove missing style
         });
         return valid;
     }
     /**
      * Create group headers and reorder the form widget according to the group spec
      *
      * @private
      */
     _init_parameter_groups() {
         // Get the parameter groups
         const groups = this.model.get('parameter_groups');
         if (!groups || !groups.length)
             return; // No groups are defined, skip this step
         // Get the UI Builder form container
         const form = this.el.querySelector('.nbtools-form > .widget-interact');
         if (!form)
             return; // If no container is found, skip this step
         // Iterate over each group, create headers and add parameters
         groups.reverse().forEach((group) => {
             const hidden = !!group['hidden']; // Is the group collapsed by default?
             // Create and add the header
             const header = this._create_group_header(group['name']);
             const body = this._create_group_body(header, group['description'], hidden);
             form.prepend(body);
             form.prepend(header);
             // Add the parameters
             group['parameters'] && group['parameters'].forEach((param_name) => {
                 const param = this._param_dom_by_name(form, param_name);
                 if (!param)
                     return; // If the parameter is not found, skip
                 body.append(param);
             });
         });
     }
     _create_group_header(name) {
         // Create the expand / collapse button
         const controls = document.createElement('controls');
         const button = document.createElement('button');
         const icon = document.createElement('span');
         controls.classList.add('nbtools-controls');
         button.classList.add('nbtools-collapse');
         icon.classList.add('fa', 'fa-minus');
         button.append(icon);
         controls.append(button);
         // Create the header
         const header = document.createElement('div');
         header.classList.add('nbtools-header', 'nbtools-group-header');
         header.append(name || '');
         header.append(controls);
         // Apply the color
         header.style.backgroundColor = this.model.get('color');
         // Return the container
         return header;
     }
     _create_group_body(header, description, hidden) {
         // Create the container
         const box = document.createElement('div');
         box.classList.add('nbtools-group');
         // Create the description
         if (description) {
             const desc = document.createElement('div');
             desc.classList.add('nbtools-description');
             desc.append(description || '');
             box.append(desc);
         }
         // Add controls to the expand / collapse button
         const button = header.querySelector('button');
         const icon = button.querySelector('span');
         button.addEventListener('click', () => {
             this._group_toggle_collapse(box, icon);
         });
         // Collapse if hidden
         if (hidden)
             this._group_toggle_collapse(box, icon);
         return box;
     }
     _group_toggle_collapse(group_box, button) {
         const collapsed = group_box.style.display === "none";
         // Hide or show widget body
         toggle(group_box);
         // Toggle the collapse button
         if (collapsed) {
             button.classList.add('fa-minus');
             button.classList.remove('fa-plus');
         }
         else {
             button.classList.remove('fa-minus');
             button.classList.add('fa-plus');
         }
     }
     _param_dom_by_name(form, name) {
         // First attempt: Try to get parameter by data-name attribute (created by attach_callbacks() method)
         let param = form.querySelector(`.nbtools-input[data-name='${name}']`);
         if (param)
             return param; // Found it! Return the parameter
         // Second attempt: Try to locate by parameter name label
         const label = form.querySelector(`.nbtools-input > .widget-label:first-child`);
         if (!label)
             return null; // No matching label found, return null
         const match = name.toLowerCase().replace(/[^a-zA-Z]/g, '') ===
             label.textContent.toLowerCase().replace(/[^a-zA-Z]/g, '');
         if (match)
             return label.closest('.nbtools-input');
         // Match not found, return null
         return null;
     }
     /**
      * Attach ID and event callbacks to the UI Builder
      *
      * @private
      */
     _attach_callbacks() {
         // Handle widget events
         const widget_events = this.model.get('events');
 
         console.log('events', this.model.get('events'))
         GalaxyUIBuilderView._attach_all_events(this.el, widget_events);
         // Handle parameter IDs and parameter events
         const json_parameters = this.model.get('_parameters');
         const dom_parameters = this.el.querySelectorAll('.nbtools-input');
         for (let i = 0; i < json_parameters.length; i++) {
             const param_spec = json_parameters[i];
             const param_el = dom_parameters[i];
             // Attach the data-name attribute
             param_el.setAttribute('data-name', param_spec.name);
             // Attach specified ID as a data-id attribute
             if (!!param_spec.id)
                 param_el.setAttribute('data-id', param_spec.id);
             // Attach parameter events
             if (!!param_spec.events) {
                 GalaxyUIBuilderView._attach_all_events(param_el, param_spec.events);
             }
             // Resize footer, if necessary
             if (param_spec.name === 'output_var' && param_spec.description) {
                 // noinspection JSConstantReassignment
                 this.el.querySelector('.nbtools-footer').style.height = '50px';
             }
         }
 
         // Attach send to / come from menus
         this._attach_menus();
         // Attach enter key submit event
         this._submit_keypress();
     }
     _submit_keypress() {
         this.el.querySelectorAll('.nbtools-form input, .nbtools-form select').forEach((element) => {
             element.addEventListener("keydown", (event) => {
                 if (event.keyCode === 13) {
                     this.el.querySelector('.nbtools-run').click();
                 }
             });
         });
     }
     /**
      * Add default choices defined in with UI Builder choice parameter to the label -> value map
      *
      * @param display_value_map
      * @param model
      * @private
      */
     _add_default_choices(display_value_map, model) {
         const choices = model.get('choices');
         if (choices && Object.keys(choices).length)
             display_value_map['Default Choices'] = model.get('choices');
     }
     /**
      * Add all files matching a specific selector to the label -> value map under the specified name
      *
      * @param display_value_map
      * @param target
      * @param kinds
      * @param selector
      * @param group_name
      * @private
      */
     _add_notebook_files(display_value_map, target, kinds, selector, group_name) {
         // Get the notebook's parent node
         const notebook = target.closest('.jp-Notebook');
         // Get all possible outputs
         const markdown_outputs = [...notebook.querySelectorAll(selector)];
         // Build list of compatible outputs
         const compatible_outputs = {};
         markdown_outputs.forEach((output) => {
             let href, label, kind;
             // Handle getting the kind and label from a link
             if (output.tagName.toLowerCase() === 'a') {
                 href = output.getAttribute('href');
                 label = (output.textContent || href).trim();
                 kind = GalaxyUIBuilderView.get_kind(href);
             }
             // Handle getting the kind and label from text
             else {
                 label = (output.textContent || 'Blank Text Option').trim();
                 href = (output.textContent || '').trim();
                 kind = 'text';
             }
             // Special case for text "send to"
             if (group_name === "Text Options") {
                 if (kinds.includes('text'))
                     compatible_outputs[label] = href;
                 kind = 'text';
             }
             // Include if matching kind
             if (GalaxyUIBuilderView.matching_kind(kinds, href))
                 compatible_outputs[label] = href;
             // Include if kinds blank and not text
             else if (kinds.length === 0 && kind !== 'text')
                 compatible_outputs[label] = href;
         });
         // Add to the label -> value map
         if (Object.keys(compatible_outputs).length > 0)
             display_value_map[group_name] = compatible_outputs;
     }
     /**
      * Add markdown input files to the label -> value map
      *
      * @param display_value_map
      * @param target
      * @param kinds
      * @private
      */
     _add_markdown_files(display_value_map, target, kinds) {
         this._add_notebook_files(display_value_map, target, kinds, '.nbtools-markdown-file', 'Notebook Instructions');
     }
     /**
      * Add markdown text options to the label -> value map
      *
      * @param display_value_map
      * @param target
      * @param kinds
      * @private
      */
     _add_markdown_text(display_value_map, target, kinds) {
         this._add_notebook_files(display_value_map, target, kinds, '.nbtools-text-option', 'Text Options');
     }
     /**
      * Add UIOutput files to the label -> value map
      *
      * @param display_value_map
      * @param target
      * @param kinds
      * @private
      */
     _add_output_files(display_value_map, target, kinds) {
         this._add_notebook_files(display_value_map, target, kinds, '.nbtools-file', 'Output Files');
     }
     _attach_kinds(attach_point) {
         const view = attach_point.widget;
         const model = view.model; // Get the model from the view
         const kinds = model.get('kinds') || ['text'];
         attach_point.setAttribute('data-type', kinds.join(', '));
     }
     _attach_name(attach_point) {
         let name = '';
         let param_element = null;
         let name_element = null;
         param_element = attach_point.closest('.nbtools-input');
         if (param_element)
             name_element = param_element.querySelector('div:first-child');
         if (name_element)
             name = name_element.textContent.replace(/\*/g, '');
         attach_point.setAttribute('data-name', name);
     }
     /**
      * Attach sent to / come from menu support to the UI Builder widget
      *
      * @private
      */
     _attach_menus() {
         this.el.querySelectorAll('.nbtools-menu-attached').forEach((attach_point) => {
             this._attach_kinds(attach_point);
             this._attach_name(attach_point);
             attach_point.addEventListener("click", (event) => {
                 const target = event.target; // Get click target
                 const element = target.closest('.nbtools-menu-attached') || target; // Get parent widget
                 const view = element.widget; // Get widget view
                 const sendto = !element.classList.contains('nbtools-nosendto'); // Send if sendto enabled
                 if (view) {
                     const model = view.model; // Get the model from the view
                     // Get the list of compatible kinds
                     const kinds = model.get('kinds') || ['text'];
                     // Get all compatible outputs and build display -> value map
                     const display_value_map = {};
                     this._add_default_choices(display_value_map, model);
                     if (sendto)
                         this._add_output_files(display_value_map, target, kinds);
                     if (sendto)
                         this._add_markdown_files(display_value_map, target, kinds);
                     if (sendto)
                         this._add_markdown_text(display_value_map, target, kinds);
                     // Update and attach the menu
                     this.attach_combobox_menu(target, display_value_map);
                     // Attach the chevron to the input... or not
                     if (Object.keys(display_value_map).length > 0)
                         attach_point.classList.add('nbtools-dropdown');
                     else
                         attach_point.classList.remove('nbtools-dropdown');
                 }
             });
             // Initial menu attachment
             // attach_point.dispatchEvent(new Event('click'));
         });
     }
     toggle_file_menu(link, display_value_map) {
         const menu = link.nextElementSibling;
         const collapsed = menu.style.display === "none";
         // If the menu is empty, don't show it
         if (menu.childElementCount === 0)
             return;
         // Hide or show the menu
         if (collapsed)
             menu.style.display = "block";
         else
             menu.style.display = "none";
         // Hide the menu with the next click
         const hide_next_click = function (event) {
             if (link.contains(event.target))
                 return;
             menu.style.display = "none";
             document.removeEventListener('click', hide_next_click);
         };
         document.addEventListener('click', hide_next_click);
     }
     /**
      * Create or update the menu based on the label -> value map
      *
      * @param target
      * @param display_value_map
      */
     attach_combobox_menu(target, display_value_map) {
         // Get the menu and empty it, if it exists.
         let menu = target.nextSibling;
         const menu_exists = menu && menu.classList.contains('nbtools-menu');
         if (menu_exists)
             menu.innerHTML = '';
         // Create and insert the menu, if necessary
         else {
             menu = document.createElement('ul');
             menu.classList.add('nbtools-menu', 'nbtools-file-menu');
             menu.style.display = 'none';
             target.parentNode ? target.parentNode.insertBefore(menu, target.nextSibling) : null;
         }
         // Iterate over display -> value map and insert menu items
         Object.keys(display_value_map).forEach((group) => {
             // Add the group label
             if (group !== 'Default Choices')
                 this.add_menu_item(group, () => { }, 'nbtools-menu-header', menu, false);
             // Loop over all files in the group
             Object.keys(display_value_map[group]).forEach((display_name) => {
                 this.add_menu_item(display_name, () => {
                     target.value = display_value_map[group][display_name];
                     target.dispatchEvent(new Event('change', { 'bubbles': true }));
                 }, 'nbtools-menu-subitem', menu, false);
             });
         });
         this.toggle_file_menu(target, display_value_map);
     }
     /**
      * Get the kind based on a given URL
      *
      * @param url
      */
     static get_kind(url) {
         return url.split(/\#|\?/)[0].split('.').pop().trim();
     }
     static matching_kind(kinds, url) {
         let match = false;
         kinds.forEach((kind) => {
             if (url.trim().endsWith(kind))
                 match = true;
         });
         return match;
     }
     /**
      * Attach a map of events to the given DOM element (widget or parameter)
      *
      * @param {HTMLElement} element
      * @param event_map
      * @private
      */
     static _attach_all_events(element, event_map) {
         Object.keys(event_map).forEach((key) => {
             const str_func = event_map[key];
             const func = new Function(str_func);
             // Handle the load event as a special case (run now)
             if (key === 'load')
                 func.call(this, new CustomEvent('load'));
             // Handle the run event as a special case (bind as click to the Run button)
             else if (key === 'run') {
                 const run_button = element.querySelector('.jupyter-button');
                 if (!!run_button)
                     run_button.addEventListener('click', func);
             }
             // Special case to handle focus events, which are swallowed by the Jupyter UI
             else if (key === 'focus')
                 element.addEventListener('focusin', func);
             // Otherwise, attach the event
             else
                 element.addEventListener(key, func);
         });
     }
     set_input_model(model, spec) {
         // Special case for DropdownModel
         if (model.name === 'DropdownModel') {
             const labels = Object.keys(spec['choices']);
             for (let i = 0; i < labels.length; i++) {
                 const label = labels[i];
                 const value = spec['choices'][label];
                 if (value === spec['default']) {
                     model.set('index', i);
                     break;
                 }
             }
         }
         else { // Otherwise just set the value traitlet
             model.set('value', spec['default']);
         }
         // Save the model
         model.save_changes();
     }
     reset_parameters() {
         const params = this.model.get('_parameters');
         for (let i = 0; i < params.length; i++) {
             const spec = params[i];
             const name = spec['name'];
             const param_element = this.element.querySelector(`[data-name='${name}']:not(.nbtools-input)`);
             if (!param_element) { // Protect against nulls
                 if (name !== 'output_var')
                     console.log(`Error finding ${name} in reset_parameters()`);
                 return;
             }
             const view = param_element.widget;
             this.set_input_model(view.model, spec);
             // Special case for file lists
             const all_inputs = param_element.parentNode ? param_element.parentNode.querySelectorAll('input') : [];
             if (all_inputs.length > 1) {
                 let first = true;
                 all_inputs.forEach((input) => {
                     if (first)
                         first = false;
                     else
                         input.value = '';
                 });
             }
         }
     }
 }
