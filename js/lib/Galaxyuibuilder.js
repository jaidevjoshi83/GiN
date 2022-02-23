/**
 * Define the GalaxyUI Builder for GalaxyLab
 *
 * @author Jayadev Joshi
 *
 * Copyright 2021 Regents of the Cleveland Clinic, Cleveland 
 */
 import '../style/Galaxyuibuilder.css';
 import '../style/historydata.css';

 import { MODULE_NAME, MODULE_VERSION } from './version';
 import { unpack_models } from "@jupyter-widgets/base";
 import { BaseWidgetModel, BaseWidgetView } from "@genepattern/nbtools";
 import _ from "underscore";
 import {  KernelSideDataObjects } from './utils';
 import { Toolbox } from '@genepattern/nbtools';
 import * as tus from "tus-js-client";

 import jQuery, { error } from "jquery";
 import axios from "axios";

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
    this.dom_class = 'galaxy-uibuilder';
    this.traitlets = [...super.basics(),  'register_tool', 'collapse', 'run_label', 'tool'];
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
        // Attach the Run button callbacks
        this.activate_run_buttons();
        // Attach custom buttons
        this.activate_custom_buttons();
    }
 
    Main_Form(inputs, call_back_data={}) {

        var FormParent = this.el.querySelector('.Galaxy-form');

        // if (this.model.get('inputs')['id'] != 'galaxylab_data_upload_tool') {
        var HistList = this.AddHistoryList(call_back_data['HID'])
        FormParent.append(HistList)
        // }
        var self = this
        _.each(inputs, (input) => {
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
 
    CreateForm(){  

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
                var tableChild1 = FormEelements[i].children;
                Object.assign(InputPerameters, this.ReturnData(tableChild1))
            }

            else if (FormEelements[i].className == 'internal-ui-repeat section-row'){
                var tableChild1 = FormEelements[i].children;
                Object.assign(InputPerameters, this.ReturnData(tableChild1))
            }
        }
        return InputPerameters
    }
 
    uid(){
        top.__utils__uid__ = top.__utils__uid__ || 0;
        return `uid-${top.__utils__uid__++}`;
    }
 
    add(input, FormParent, NamePrefix, data={}){

        var input_def = input;

        if (input_def.id == 'undefined') {
            input_def.id = this.uid()
        }

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
                this.AddDrill_Down(input_def, FormParent, NamePrefix)
                break
            case "data_upload":
                this.DataUpload(FormParent)
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

    AddDrill_Down(input_def, FormParent, NamePrefix){
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

    AddText (input_def, FormParent, NamePrefix){

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

    async DataUpload(FormParent) {

        var data_upload = `
                        <div class="upload_tab">
                           <div class="tab">
                                <button type="button" class="tablinks" >Upload</button>
                                <button type="button" class="tablinks">From URL</button>
                                <button type="button" class="tablinks">Create data</button>
                           </div>

                            <!-- Tab content -->
                            <div id="upload" class="tabcontent">
                                <p><b>Upload file to the Galaxy server.</b></p>
                                <input id="inputupload" class="input_upload" type="file" style="display: block" >
                            </div>
                          
                            <div id="from_url" class="tabcontent">
                                <p><b>Upload file from a URL to the Galaxy server.</b></p> 
                                <input class="input_upload" style="display: block" >
                            </div>
                            
                            <div id="create_data" class="tabcontent">
                                <p><b>Create a data file and upload to the Galaxy server.</b></p>
                                <textarea class="input_upload" style="height: 30vh; width: 45vw;" >
                                Example test for testing
                                </textarea>
                            </div>

                        </div>`



        // ${JSON.stringify('http://192.168.1.113:8000/data')}

        const utm = new DOMParser().parseFromString(data_upload, 'text/html').querySelector('.upload_tab')
        var List = utm.querySelectorAll('.tablinks')        

        utm.querySelector('#upload').style.display  = 'block'

        List.forEach((button) => button.addEventListener('click', () => {

            if (button.innerText  == 'From URL') {
                utm.querySelector('#upload').style.display  = 'none'
                utm.querySelector('#from_url').style.display  = 'block'
                utm.querySelector('#create_data').style.display  = 'none'

            } else if (button.innerText  == 'Create data') {
                utm.querySelector('#upload').style.display  = 'none'
                utm.querySelector('#from_url').style.display  = 'none'
                utm.querySelector('#create_data').style.display  = 'block'                
            } else if (button.innerText  == 'Upload') {

                utm.querySelector('#upload').style.display  = 'block'
                utm.querySelector('#from_url').style.display  = 'none'
                utm.querySelector('#create_data').style.display  = 'none'
            }

        }));

        var datatypes_genomes = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.get_data_type_and_genomes(GalInstance=${JSON.stringify(this.model.get('GalInstance'))})`)

        var Input = utm.querySelector('#inputupload')

        this.Upload_callback(Input)

        var datatypeSelect = document.createElement('select')
        datatypeSelect.className = 'datatypes_options'

        for(var i = 0; i < datatypes_genomes['datatypes'].length; i++) {
            const opt = datatypes_genomes['datatypes'][i];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value =  datatypes_genomes['datatypes'][i];;
            datatypeSelect.appendChild(el);
        }

        var genomeSelect = document.createElement('select')
        genomeSelect.className = 'genomes_options'

        for(var i = 0; i < datatypes_genomes['genomes'].length; i++) {
            const opt = datatypes_genomes['genomes'][i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value =  datatypes_genomes['genomes'][i][1];;
            genomeSelect.appendChild(el);
        }

        var datatype_title = document.createElement('p')
        datatype_title.innerText = 'Datatypes'

        var genomes_title = document.createElement('p')
        genomes_title.innerText = 'Genomes'

        utm.append(datatype_title)
        utm.append(datatypeSelect)
        utm.append(genomes_title)
        utm.append(genomeSelect)

        FormParent.append(utm)

    }

    submitPayload(payload, credentials) {

        console.log('ok-2')

        axios.post(`${credentials['URL']}/api/tools/fetch?key=${credentials['API_key']}`, payload)
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    NewTusUpload( data){

        var self = this
        var chunkSize = 10485760;
        var file = data.files[0];
        var credentials = this.model.get('GalInstance')
        data['key'] =  credentials['API_key']

        // Create a new tus upload
        var upload = new tus.Upload(file, {
            endpoint: `${credentials['URL']}/api/upload/resumable_upload/`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            chunkSize: chunkSize,

            metadata: {
                filename: file.name,
                filetype: file.type,
            },
            headers: {
                x_api_key: credentials['API_key'],
            },
            
            onError: function(error) {
                console.log("Failed because: " + error)
            },
            onProgress: function(bytesUploaded, bytesTotal) {
                
                var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
                console.log(bytesUploaded, bytesTotal, percentage + "%")
            },
            onSuccess: function() {
                console.log("Download %s from %s", upload.file.name, upload.url)

                data[`files_${0}|file_data`] = {
                    session_id: upload.url.split("/").at(-1),
                    name: upload.file.name,
                };
                self.submitPayload(data, credentials)
            }
            
        })
    
        // Check if there are any previous uploads to continue.
        upload.findPreviousUploads().then(function (previousUploads) {
            // Found previous uploads so we select the first one. 
            if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0])
            }
    
            // Start the upload
            upload.start()
        })

        console.log(upload)
    }

    Upload_callback(input){

        var self  = this

        var children = this.element.querySelector('.Galaxy-form')

        input.addEventListener("change", function(e) {

            var cnf = {};

            var data = {
                "history_id": self.element.querySelector('#History_IDs').value,
                "targets": [
                    {
                        "destination": {
                            "type": "hdas"
                        },
                        "elements": [
                            {
                                "src": "files",
                                "url": "",
                                "paste_content": null,
                                "name":  input.files[0]['name'],
                                "dbkey": children.querySelector('.genomes_options').value,
                                "ext": children.querySelector('.datatypes_options').value,
                            }
                        ]
                    }
                ],
                "auto_decompress": true, 
                'files': input.files,
            }
            self.NewTusUpload(data)
            
        })
    }

   async dataupload_job() {

        // this.hide_run_buttons(true)

        var children = this.element.querySelector('.Galaxy-form')
        var upload_link 
        var  upload_method

        for (var i = 0; i < children.querySelectorAll('.tabcontent').length; i++ ) {
            if (children.querySelectorAll('.tabcontent')[i].style.display == 'block') {
                upload_link = children.querySelectorAll('.tabcontent')[i].querySelector('.input_upload').value
                upload_method = children.querySelectorAll('.tabcontent')[i].querySelector('.input_upload').type
            }
        }

        var datatype = children.querySelector('.datatypes_options').value
        var genome = children.querySelector('.genomes_options').value
        var history_id = children.querySelector('#History_IDs').value

        var InitialData = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.upload_dataset(file_path=${JSON.stringify(upload_link)}, upload_method=${JSON.stringify(upload_method)}, datatype=${JSON.stringify(datatype)}, genome=${JSON.stringify(genome)}, GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, HistoryID=${JSON.stringify(history_id)} )`);

    }

    async AddOutPutDataTable( JobID){

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
            }, false)

            DataTableElement.addEventListener("dragstart", function(event) {

                self.dragged = event.target;

                }, false);

            DataTable.append(DataTableElement)
        }

        var OutPutDataSection =  this.el.querySelector('.output-file-names')
        OutPutDataSection.append(DataTable)

        return Dt
    }

    async AddDataSetTable(selected_value='default', Dt=[], state=''){

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
        
                }, false);
    
            return DataHistoryList
    }

    AddHistoryList(selected_value='default'){

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

            if (this.model.get('inputs')['id'] != 'galaxylab_data_upload_tool') {

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
            }

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
 
    AddRepeat(input_def, FormParent, NamePrefix){

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
 
    removeAllChildNodes(parent){
         while (parent.firstChild) {
             parent.removeChild(parent.firstChild);
         }
    }

    FileUpLoad (input_def, FormParent, NamePrefix, call_back_data={}){    
        
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


        // if (call_back_data['RecCall'] == true) {

        for(var i =0; i < Select.options.length; i++) {
                for(var k = 0; k < input_def.value.values.length; k++ ) {                    
                if (Select.options[i].value == input_def.value.values[k]['id']){
                    Select.options[i].selected = true
                }
            }
        }
        // } 

        Select.addEventListener("dragover", function(event) {
            // prevent default to allow drop
            event.preventDefault();
      
        }, false);


        Select.addEventListener("drop", async function(event) {
            // prevent default action (open as link for some elements)
            event.preventDefault();
            // move dragged elem to the selected drop targe
            if (event.target.className == "selectbox-scrollable") {

                event.target.style.background = "";
                var draged_item = self.dragged.firstElementChild

                self.removeAllChildNodes(Select)

                const opt = draged_item.querySelector('.name').innerText
                const el = document.createElement("option");
                el.textContent = opt;
                el.value = draged_item.getAttribute('data-value') //Fix me 

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

    AddInteger (input_def, FormParent, NamePrefix){

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
 
    AddFloat (input_def, FormParent, NamePrefix){

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
 
    AddConditionalSelectField (input_def, ElID, NamePrefix, call_back_data={}){

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
 
    AddSelectField (input_def, FormParent, NamePrefix){

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

    TestAddSelectField (input_def, FormParent, NamePrefix){

        input_def.id = this.uid()
        var self = this

        const options =  input_def['options']['hda']
        const select = document.createElement('select')
        select.id = `select-${input_def.id}`  
        select.className = 'InputData'   
        select.name = NamePrefix

    
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
 
    AddBooleanField (input_def, FormParent, NamePrefix ){

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

    collect_data() {
        const Childrens  = this.el.querySelector('.nbtools-form').children;
    }
 
    AddConditoinalSection2 (input_def, parent, NamePrefix, call_back_data={}){

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

    AddSection (input_def, parent, NamePrefix){

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

    waitforme (milisec){
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
    }

    async data_row_list (GalInstance, HistoryID){

        var DataList = document.createElement('ul')
        DataList.className = 'list-item'
        DataList.style.overflow = 'auto'
        DataList.style.height = '400px'
        DataList.style.overflowX = 'scroll'
        DataList.style.overflowY = 'scroll'
    
        var datasets = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.history_data_list(GalInstance=${JSON.stringify(GalInstance)}, HistoryID=${JSON.stringify(HistoryID)} )`) 

        for (var i = 0; i < datasets.length; i++){

            if ('ok' == datasets[i]['state'] || datasets[i]['populated_state']) {

                if (datasets[i]['history_content_type'] == 'dataset') {
                    DataList.append( await this.dataset_row_ok_state(datasets[i], HistoryID))
                } 

                else if (datasets[i]['history_content_type'] == 'dataset_collection') {
                    DataList.append( await this.dataset_collection_row_state (datasets[i], HistoryID))
                }
            }

            else if ('error' == datasets[i]['state'] || datasets[i]['populated_state']) {
                DataList.append(await this.dataset_row_error_state(datasets[i], HistoryID))
            }
        }
        return DataList
    }

    async dataset_collection_row_state (dataset, history_id){


        var self = this

        var URL = this.model.get('GalInstance')['URL']

        var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_dataset_collection(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(dataset['id'])} )`) 

        var row = `<div id="${dataset['type_id']}"   class="list-item ${show_dataset['history_content_type']} history-content state-${show_dataset['populated_state']}" >
                    <div class="warnings"></div>
                    <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                    <div class="primary-actions">
                        <a class="download-btn icon-btn" href="${URL}/api/dataset_collections/${dataset['id']}/download" title="" data-original-title="Download"> <span class="fa fa-floppy-o"></span> </a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style=""></span></a>
                    </div>
                    <div class="title-bar clear"  tabindex="0" draggable="true" ondragstart="event.dataTransfer.setData('text/plain',null) > 
                        <span class="state-icon"></span>
                        <div class="title" data-value=${show_dataset['id']} > 
                            <span class="hid">${show_dataset['hid']}: </span> <span class="name">${show_dataset['name']}</span>
                        </div>
                        <br>
                        <div>a list with ${show_dataset['element_count']} items</div>
                    </div>
                    
                    <div class="list-items"  style="display: none; border: solid white 2px; margine; margin: 20px; "></div>
                </div>`
        
        const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector(`.list-item.${dataset['history_content_type']}.history-content.state-${show_dataset['populated_state']}`)

        for (var i = 0; i < show_dataset['elements'].length; i++){
            Tbl.querySelector('.list-items').append(await self.dataset_collection_list_item(show_dataset['elements'][i]))
        }

        Tbl.querySelector('.name').addEventListener('click', async (e) => {

            if (Tbl.querySelector('.list-items').style.display == 'block') {
                Tbl.querySelector('.list-items').style.display = 'none'
            } else{
                Tbl.querySelector('.list-items').style.display = 'block'
            }
        });

       var Title = Tbl.querySelector('.title-bar.clear')

       var dragged

        Title.addEventListener("dragstart", (event) => {

            this.dragged = event.target;

        }, false);


        var Download = Tbl.querySelector('.fa.fa-download')

        Download.addEventListener('click', () => {

            KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(collection_id=${JSON.stringify(show_dataset['id'])}, GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, file_name=${JSON.stringify(dataset['name'])}, data_type='collection')`);
        })

        self.delete_dataset(Tbl, dataset['id'],  history_id, 'collection')

        return Tbl
    } 
    
    async dataset_row_ok_state (dataset, history_id){

        var URL = this.model.get('GalInstance')['URL']

        var row = `<div id="${dataset['type_id']}"   class="list-item ${dataset['history_content_type']} history-content state-ok" >
                    <div class="warnings"></div>
                    <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                    <div class="primary-actions"><a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style=""></span></a></div>
                    <div class="title-bar clear"  tabindex="0" draggable="true" ondragstart="event.dataTransfer.setData('text/plain',null) > 
                    <span class="state-icon"></span>
                        <div class="title" data-value=${dataset['id']} > 
                            <span class="hid">${dataset['hid']}: </span> <span class="name">${dataset['name']}</span>
                        </div>
                        <br>
                        <div title="0 nametags" class="nametags"></div>
                    </div>
                </div>`
            
        const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector(`.list-item.${dataset['history_content_type']}.history-content.state-ok`)

        Tbl.addEventListener('click', async (e) => {

            if (Tbl.querySelector('.details') == null ){
                var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(dataset['id'])} )`) 

                if (dataset['state'] == 'ok') {
                    var error_details = await this.dataset_ok_details(show_dataset)
                    Tbl.append(error_details)
                }
                else if (dataset['state'] == 'error')  {
                    var ok_details = await this.dataset_error_details(show_dataset)
                    Tbl.append(ok_details)
                }
            }

            if (Tbl.querySelector('.details').style.display == 'block') {
                Tbl.querySelector('.details').style.display = 'none'
            } else{
                Tbl.querySelector('.details').style.display = 'block'
            }
        });

        var Title = Tbl.querySelector('.title-bar.clear')

        var dragged

        Title.addEventListener("dragstart", (event) => {

            this.dragged = event.target;

        }, false);

        this.delete_dataset(Tbl, dataset['id'],  history_id)
        // this.attach_data_load_event(Tbl, dataset, `${URL}/datasets/${dataset['id']}/display/?preview=True`)
        this.attach_data_load_event(Tbl, dataset,  `${URL}/datasets/${dataset['id']}/display?to_ext=${dataset['extension']}`, `${dataset['extension']}`)

        return Tbl
    } 
    
    async dataset_row_error_state (dataset, HistoryID){

        var URL = this.model.get('GalInstance')['URL']

        var row = `<div id="${dataset['type_id']}" class="list-item ${dataset['history_content_type']} history-content state-error">
                        <div class="warnings"></div>
                        <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                        <div class="primary-actions"><a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                        <div class="title-bar clear" tabindex="0" draggable="true"> <span class="state-icon"></span>
                            <div class="title"> <span class="hid">${dataset['hid']}: </span> <span class="name">${dataset['name']}</span> </div>
                            <br>
                            <div title="0 nametags" class="nametags"></div>
                        </div>

                    </div>`

        const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector(`.list-item.${dataset['history_content_type']}.history-content.state-error`)
        
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

        this.delete_dataset(Tbl, dataset['id'],  HistoryID)

        return Tbl
    }

    async dataset_error_details (dataset){

        var URL = this.model.get('GalInstance')['URL']


        var details =  `<div class="details" style="display: none;">
                            <div class="summary">
                            <div class="detail-messages">${dataset['misc_blurb']}</div>
                            <span class="help-text">An error occurred with this dataset:</span>
                            <div class="job-error-text">${dataset['misc_info']}</div>
                            </div>
                            <div class="actions clear">
                                <div class="left"><a class="icon-btn report-error-btn" title="" target="_blank" href="${URL}/datasets/error?dataset_id=${dataset['dataset_id']}" data-original-title="View or report this error"><span class="fa fa-bug" style=""></span></a><a class="icon-btn params-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a>
                            </div>

                            <div class="annotation-display"></div>
                            <div class="display-applications"></div>
                        </div>`
            
        const error_details_html = new DOMParser().parseFromString(details, 'text/html').querySelector('.details')

        return error_details_html
    }

    async dataset_row_queued_state (dataset){

    var URL = this.model.get('GalInstance')['URL']

    var row =   `<div id="${dataset['type_id']}" class="list-item dataset history-content state-queued" style="display: block;">
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

    async dataset_ok_details (dataset){

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
                                    <a class="download-btn icon-btn"  href="${URL}/datasets/${dataset['id']}/display?to_ext=${dataset['extension']}" title="" data-original-title="Download"> <span class="fa fa-save"></span> </a><a class="icon-btn" title=""  href="javascript:void(0);" data-original-title="Copy link"><span class="fa fa-chain" style=""></span></a><a class="icon-btn params-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn visualization-link" title="" target="_blank" href="${URL}/visualizations?dataset_id=${dataset['dataset_id']}" data-original-title="Visualize this data"><span class="fa fa-bar-chart" style=""></span></a>
                                </div>
                            </div>

                            <div class="annotation-display"></div>
                            <div class="display-applications"></div>

                            <pre class="dataset-peek"> ${dataset['peek']}</pre> 
                        </div>
                       `

        const ok_details_html = new DOMParser().parseFromString(details, 'text/html').querySelector('.details')

        var display_apps = ok_details_html.querySelector('.display-applications')

        this.add_display_application(display_apps, dataset)

        this.copy_download_link(ok_details_html)

        return ok_details_html
    }

    async dataset_row_running_state (dataset){
        
        var URL = this.model.get('GalInstance')['URL']
        
            var row = `<div id="${dataset['type_id']}" class="list-item dataset history-content state-running" >
                            <div class="warnings"></div>
                            <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                            <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${dataset['dataset_id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                            <div class="title-bar clear" tabindex="0" draggable="true"> <span class="state-icon"></span>
                                <div class="title"> <span class="hid">${dataset['hid']}: </span> <span class="name">${dataset['name']}</span> </div>
                                <br>
                                <div class="nametags"></div>
                            </div>
                            <div class="details" style="display: none;">
                                <div class="summary">
                                    <div class="detail-messages"></div>
                                    <div>This job is currently running</div>
                                </div>
                                <div class="actions clear">
                                    <div class="left"><a class="icon-btn params-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn rerun-btn" title="" target="galaxy_main" href="#" data-original-title="Run this job again"><span class="fa fa-refresh" style=""></span></a><a class="icon-btn icon-btn" title="" href="#" data-original-title="Tool Help"><span class="fa fa-question" style=""></span></a></div>
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
    
    async dataset_row_new_state (dataset){

        var URL = this.model.get('GalInstance')['URL']
    
        var row = `<div id="dataset-${dataset['dataset_id']}" class="list-item dataset history-content state-running" style="display: none;">
                        <div class="warnings"></div>
                        <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                        <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${dataset['dataset_id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a></div>
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
    
    async attach_event (Node, className){ 

        var DataSets = Node.querySelectorAll(className)
    
        DataSets.forEach((button) => button.querySelector('.title').addEventListener('click', (e) => {
    
            if (button.querySelector('.details').style.display == 'block') {
                button.querySelector('.details').style.display = 'none'
            } else{
                button.querySelector('.details').style.display = 'block'
            }
    
        }));
        
    }

    async delete_dataset (row, dataset_id,  HistoryID, datatype='dataset'){

        var DeleteButton = row.querySelector('.fa.fa-times')

        DeleteButton.addEventListener('click', async (e) => {
            DeleteButton.parentNode.parentNode.parentNode.parentNode.removeChild(DeleteButton.parentNode.parentNode.parentNode)
            // if (datatype == 'dataset') {
            await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.delete_dataset(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, history_id=${JSON.stringify(HistoryID)}, dataset_id=${JSON.stringify(dataset_id)})`)
            // } 
            // else if (datatype == 'collection') {
            //     await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.delete_dataset_collection(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, history_id=${JSON.stringify(HistoryID)}, dataset_collection_id=${JSON.stringify(dataset_id)})`)
            // }    
        });
    }

    copy_download_link (ok_details_html){

        var chain_button = ok_details_html.querySelector('.fa.fa-chain')

        chain_button.addEventListener('click', (e) => {
            console.log(ok_details_html.querySelector('.download-btn.icon-btn')['href'])
        });

    }
    
    async AddJobStatusWidget (Inputs, HistoryID){

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

            var data = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.OutPutData(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, JobID=${JSON.stringify(job['id'])} )`);

            var JobState = data[0]['state']
            var ListItem =  this.el.querySelector('.list-item')


            if (JobState=='running'  ){
                var gearrotate = this.el.querySelector('.gear-rotate-icon')
                gearrotate.style.display = 'block'

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Job Running'
                JobDoneText.style.color = '#F5A207'

                var StdError  = this.el.querySelector('.donemessagelarge')
                StdError.style.background = '#ffe6cd'

                for (var j =0; j < data.length; j++){

                    var id=`dataset-${data[j]['id']}`

                    if(ListItem.querySelector(`#${id}`) !== null){
                        var e = ListItem.querySelector(`#${id}`)
                        e.parentElement.removeChild(e)
                    }

                    if (ListItem.querySelector(`#dataset-${data[j]['id']}`) == null ) {
                        ListItem.prepend(await this.dataset_row_running_state(data[j]))
                    }
                }

            } 
            else if (['queued', 'new'].includes(JobState)) {

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Job queued'

                var StdError  = this.el.querySelector('.donemessagelarge')
                StdError.style.background = '#7d959d70'

                for (var j =0; j < data.length; j++){

                    if (ListItem.querySelector(`#dataset-${data[j]['id']}`) == null ) {

                        ListItem.prepend(await this.dataset_row_queued_state(data[j]))
                    }
                }

            } 
            else if (JobState == 'ok'){

                for (var j =0; j < data.length; j++){
                    var id=`dataset-${data[j]['id']}`

                    if ( ListItem.querySelector(`#${id}`) !== null) {
                        var e = ListItem.querySelector(`#${id}`)
                        e.parentElement.removeChild(e)
                    }

                    ListItem.prepend(await this.dataset_row_ok_state(data[j]))
                }

                var StdError  = this.el.querySelector('.donemessagelarge')
                StdError.style.background = '#c2ebc2'               

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Job complete'

                var gearrotate = this.el.querySelector('.gear-rotate-icon')
                gearrotate.style.display = 'none'

                var gearrotate = this.el.querySelector('.job-done-icon')
                gearrotate.style.display = 'block'

            } 

            else if (JobState == 'error'){

                for (var j =0; j < data.length; j++){

                    var id=`dataset-${data[j]['id']}`

                    if ( ListItem.querySelector(`#${id}`) !== null) {
                        var e = ListItem.querySelector(`#${id}`)
                        e.parentElement.removeChild(e)
                    }
                    ListItem.prepend(await this.dataset_row_error_state(data[j], HistoryID))
                 }

                var JobDoneText = this.el.querySelector(".job-state-text")
                JobDoneText.innerText = 'Fatal Error'
                JobDoneText.style.color = 'white'

                var gearrotate = this.el.querySelector('.gear-rotate-icon')
                gearrotate.style.display = 'none'

                var gearrotate = this.el.querySelector('.job-error-icon')
                gearrotate.style.display = 'block'

                var StdError  = this.el.querySelector('.donemessagelarge')
                StdError.style.background = '#f4a3a5'
            }

            await this.waitforme(5000);

            if (states.includes(JobState) === true ) {
                break;
            }      
        }
    }

    JobStatusTemplate (HistoryID){

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
            this.removeAllChildNodes(toolForm)
            GBody.prepend(Job)
            var BTN = this.el.querySelector('.rbtn')

            BTN.addEventListener('click', async (e) => {

                var refine_inputs  = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(GalInstance=${JSON.stringify(self.model.get('GalInstance'))}, toolID=${JSON.stringify(self.model.get('ToolID'))}, HistoryID=${JSON.stringify(HistoryID)})`)
                var JobStatus = self.el.querySelector('.job-status-widget')

                var GbForm = document.createElement('div')
                GbForm.className = 'Galaxy-form'
                
                GBody.prepend(GbForm)
                JobStatus.parentNode.removeChild(JobStatus)

                self.Main_Form(refine_inputs['inputs'])
                self.AddHelpSection(refine_inputs['help'])
                self.hide_run_buttons()
            } );
    }

    async input_output_file_name (job){

        var Table = `<div class="donemessagelarge">
                        <p> Executed <b>${this.model.get('GalInstance')['tool_name']}</b> and successfully added 1 job to the queue. </p>
                        <p>The tool uses this input:</p>
                        <ul class="inputs">
                        </ul>
                        <p>It produces this output:</p>
                        <ul class=outputs>
                        </ul> 

                        <p> You can check the status of queued jobs and view the resulting data at the History panel.
                         When the job has been run the status will change from 'Job queued', 'running' to ' Job Complete' if completed successfully or
                        'fatal error' if problems were encountered. </p>
                    </div>
                    `

        var JobPanel = new DOMParser().parseFromString(Table, 'text/html').querySelector('.donemessagelarge')

        var inputs = JobPanel.querySelector('.inputs')
        var outputs = JobPanel.querySelector('.outputs')

        for (var j =0; j < Object.keys(job['inputs']).length; j++){

            var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(job['inputs'][Object.keys(job['inputs'])[j]]['id'])} )`) 
            var ILi  = document.createElement('li')
            var Ib = document.createElement('b')
            Ib.innerText = `${show_dataset['name']}`
            ILi.append(Ib)
            inputs.append(ILi)
        }

        for (var k =0; k < Object.keys(job['outputs']).length; k++){

            var OLi  = document.createElement('li')
            var Ob = document.createElement('b')
            var show_dataset = await KernelSideDataObjects(`from galaxylab  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(GalInstance=${JSON.stringify(this.model.get('GalInstance'))}, dataset_id=${JSON.stringify(job['outputs'][Object.keys(job['outputs'])[k]]['id'])} )`) 
            Ob.innerText =  `${show_dataset['name']}`
            OLi.append(Ob)
            outputs.append(OLi)
            }

    return JobPanel
    }

    async dataset_collection_list_item (elements){

        var URL = this.model.get('GalInstance')['URL']

        var ListItem = `<div id="dataset-${elements['object']['id']}" class="list-item dataset state-${elements['object']['state']}" >
                          <div class="warnings"></div>
                          <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                          <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${elements['object']['id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/edit?dataset_id=${elements['object']['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style=""></span></a></div>
                          <div class="title-bar clear" tabindex="${elements['element_index']}" draggable="true"><span class="state-icon"></span>
                          <div class="title"><span class="name">${elements['element_index']}</span></div>
                          </div>
                          <div class="details" style="display: none;">
                          <div class="summary">
                                <div class="detail-messages"></div>
                                <div class="blurb"><span class="value">${elements['object']['misc_blurb']}</span></div>
                                <div class="datatype">
                                    <label class="prompt">format</label><span class="value">${elements['object']['file_ext']}</span></div>
                                <div class="dbkey">
                                    <label class="prompt">database</label><a class="value" href="/datasets/edit?dataset_id=${elements['object']['id']}" target="_top">?</a></div>
                                <div class="info"><span class="value">${elements['object']['misc_info']}</span></div>
                            </div>
                            <div class="actions clear">
                                <div class="left">
                                    <a class="download-btn icon-btn"  href="${URL}/datasets/${elements['object']['id']}/display?to_ext=${elements['object']['file_ext']}" title="" data-original-title="Download"> <span class="fa fa-save"></span> </a><a class="icon-btn" title=""  href="javascript:void(0);" data-original-title="Copy link"><span class="fa fa-chain" style=""></span></a><a class="icon-btn params-btn" title="" target="_blank" href="${URL}/datasets/${elements['object']['id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn visualization-link" title="" target="_blank" href="${URL}/visualizations?dataset_id=${elements['object']['id']}" data-original-title="Visualize this data"><span class="fa fa-bar-chart" style=""></span></a>
                                </div>
                                <div class="right"><a class="icon-btn tag-btn" title="" href="javascript:void(0);" data-original-title="Edit dataset tags"><span class="fa fa-tags" style=""></span></a><a class="icon-btn annotate-btn" title="" href="javascript:void(0);" data-original-title="Edit dataset annotation"><span class="fa fa-comment" style=""></span></a></div>
                            </div>
                            <div class="annotation-display"></div>
                            <div class="display-applications"></div>
                            <pre class="dataset-peek">${elements['object']['peek']}</pre>
                         </div>
                         </div>`
      
        const row = new DOMParser().parseFromString(ListItem, 'text/html').querySelector('.list-item.dataset.state-ok')

        row.querySelector('.name').addEventListener('click', async (e) => {

        if (row.querySelector('.details').style.display == 'block') {
            row.querySelector('.details').style.display = 'none'
        } else{
            row.querySelector('.details').style.display = 'block'
        }

        });

        var Download = row.querySelector('.fa.fa-download')

        Download.addEventListener('click', () => {
            KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(data_url=${JSON.stringify(`${URL}/datasets/${elements['object']['id']}/display?to_ext=${elements['object']['file_ext']}`)}, file_name=${JSON.stringify(`${elements['object']['name']}`)}, ext=${JSON.stringify(`${elements['object']['file_ext']}`)})`);
        })

      
        return row
    }

    busy_changed (){
         const display = this.model.get('busy') ? 'block' : 'none';
         this.element.querySelector('.nbtools-busy').style.display = display;
    }

    display_header_changed (){
        const display = this.model.get('display_header') ? 'block' : 'none';
        this.element.querySelector('.nbtools-buttons:first-of-type').style.display = display;
        this.element.querySelector('.nbtools-description').style.display = display;
    }

    display_footer_changed (){
        const display = this.model.get('display_footer') ? 'block' : 'none';
        this.element.querySelector('.nbtools-buttons:last-of-type').style.display = display;
        this.element.querySelector('.nbtools-footer').style.display = display;
        // If there is an output_var element, hide or show it as necessary
        if (!this.output_var_displayed())
            return;
        this.element.querySelector('.nbtools-input:last-of-type').style.display = display;
    }

    output_var_displayed (){
        const output_var = this.model.get('_parameters')['output_var'];
        return !!(output_var && output_var['hide'] == false);
    }

    activate_custom_buttons (){
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

    activate_run_buttons (){
 
        var self  = this;
        this.el.querySelectorAll('.nbtools-run').forEach((button) => button.addEventListener('click', () => {

        var HistoryID = self.element.querySelector('#History_IDs').value 
        var children = self.element.querySelector('.Galaxy-form').children;
        var Inputs = self.ReturnData(children)

        if (this.model.get('inputs')['id'] == 'galaxylab_data_upload_tool') {
            this.dataupload_job()
           
        } else {

            this.AddJobStatusWidget(Inputs, HistoryID)

        }

         }));
    }

    hide_run_buttons (hide){
        var self  = this;
        this.el.querySelectorAll('.nbtools-run').forEach((button) =>{
            if (hide == true){
                button.style.display = 'none';
            } else { 
                button.style.display = 'block';
            }
        });
    }

    form_refresh_button (element){
        var self  = this;

        var button = element.querySelector('.icon-btn.rerun-btn')

        button.addEventListener('click', async (e) => {

            var refine_inputs  = await KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(GalInstance=${JSON.stringify(self.model.get('GalInstance'))}, toolID=${JSON.stringify(self.model.get('ToolID'))}, HistoryID='df7a1f0c02a5b08e')`)
            var FormParent = self.el.querySelector('.Galaxy-form')
            self.removeAllChildNodes(FormParent)
            self.Main_Form(refine_inputs['inputs'])
        });
    }

    load_tabular_files (hid, data_url, ext){

        KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\ndata_${hid} = GalaxyTaskWidget.download_file_to_jupyter_server(${JSON.stringify(data_url)}, ${JSON.stringify(ext)})`);
        KernelSideDataObjects(`print('data_${hid}')`);
    }

    download_datafiles_to_server (data_url, file_name, ext){

        KernelSideDataObjects(`from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(${JSON.stringify(data_url)}, ${JSON.stringify(file_name)}, ${JSON.stringify(ext)})`);
    }

    attach_data_load_event (headnode, dataset, url, ext){

        var self = this

        var LoadButton = headnode.querySelector('.fa.fa-download')

        var details =  `<div class="data-load-status" >
                            <div class="title" style="float: left; margin-top: 5px; margin-left: 5px; overflow-x: auto;" > 
                                 <span class="hid"><b>${dataset['hid']}</b>: </span> <span class="name" >Data <b>${dataset['name']}</b> loaded successfully, can be accessed inside the current notebook cell via <a href="javascript:void(0);" ><b style="color: white;"> data_${dataset['hid']}</b></a> variable. </span>
                            </div>
                            <div class="primary-actions" style="float: right; margin-top: 2px;"><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-plus" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a></div>
                        </div>`

        const ok_details_html = new DOMParser().parseFromString(details, 'text/html').querySelector('.data-load-status')

        LoadButton.addEventListener('click', ()=>{
            // var  NbtoolsForm =  self.el.querySelector('.nbtools-form')
            // NbtoolsForm.append(ok_details_html)
            // this.load_tabular_files (dataset['hid'], url, dataset['name'])
            this.download_datafiles_to_server(url, dataset['name'], ext)
        });

        var DeleteButton = ok_details_html.querySelector('.fa.fa-times')

        DeleteButton.addEventListener('click', () => {
            ok_details_html.parentNode.removeChild(ok_details_html)
            KernelSideDataObjects(`del data_${dataset['hid']}`);
        })

        var AddCellButton = ok_details_html.querySelector('.fa.fa-plus')

        AddCellButton.addEventListener('click', () => {
            Toolbox.add_code_cell(`data_${dataset['hid']}`);
        })        
    }

    add_display_application (display_apps, data) {

        var url = this.model.get('GalInstance')['URL']

        var apps1 = data['display_apps']
        var apps2 = data['display_types']
        var data = apps1.concat(apps2)

        for (var i = 0; i < data.length; i++){

            var display_app = document.createElement('div')
            display_app.className = 'display-application'

            var DisAppsSpan = document.createElement('span')
            DisAppsSpan.className = 'display-application-location'
            DisAppsSpan.innerText = data[i]['label']

            var DisAppsSpanLink = document.createElement('span')
            DisAppsSpanLink.className = 'display-application-links'

            display_app.append(DisAppsSpan)
            display_app.append(DisAppsSpanLink)
            display_apps.append(display_app)

            for (var j = 0; j < data[i]['links'].length; j++) {

                var Link = document.createElement('a')
                Link.target = data[i]['links'][j]['target']
                Link.href = url+data[i]['links'][j]['href']
                Link.innerText = data[i]['links'][j]['text']

                DisAppsSpanLink.append(Link)
            }
        // <div class="display-application"><span class="display-application-location">data[i]['label']</span> <span class="display-application-links"><a target="_blank" href="data[i]['label']">View</a> </span></div>
        }

        return display_apps
    }
    
}