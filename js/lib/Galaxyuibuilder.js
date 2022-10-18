/**
 * Define the GalaxyUI Builder for GiN
 *
 * @author Jayadev Joshi
 *
 * Copyright 2021 Regents of the Cleveland Clinic, Cleveland 
 */

import '../style/Galaxyuibuilder.css';
import '../style/historydata.css';
import '../style/galaxy-form.css';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { unpack_models } from "@jupyter-widgets/base";
import { BaseWidgetModel, BaseWidgetView } from "@g2nb/nbtools";
import _ from "underscore";
import {  is_url, KernelSideDataObjects, show } from './utils';
import * as tus from "tus-js-client";
import axios from "axios";
import { Data } from '@g2nb/nbtools/lib/dataregistry';
import { ContextManager } from '@g2nb/nbtools';
import { Toolbox } from '@g2nb/nbtools';

export class GalaxyUIBuilderModel extends BaseWidgetModel{
     
    defaults() {
        return Object.assign(Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyUIBuilderModel.model_name, _model_module: GalaxyUIBuilderModel.model_module, _model_module_version: GalaxyUIBuilderModel.model_module_version, _view_name: GalaxyUIBuilderModel.view_name, _view_module: GalaxyUIBuilderModel.view_module, _view_module_version: GalaxyUIBuilderModel.view_module_version, name: 'Python Function', description: '', origin: '', _parameters: [], parameter_groups: [], function_import: '', register_tool: true, collapse: true, events: {}, buttons: {}, display_header: true, display_footer: true, busy: false, run_label: 'Execute', gal_instance: {}, output: undefined, inputs:{}, form_output:{}, UI:{}, galaxy_tool_id:'', history_data:[], history_ids:[] }));
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
    
    <div class="nbtools-form"> 
    
        <div class="Galaxy-form-div">

            <div class="tool-forms"> 
                <div class="galaxy-history-list">
                    <label id="dataset-history-label" for="history-list">Select History</label><br>
                    
                </div>

                <form class="Galaxy-form">
                </form>
            </div>

            <div class="dataset-list">
                <label id="dataset-history-label" for="history-list">Select History</label>
                <label id="dataset-update-label" for="history-list"> Update <i class="fa fa-refresh" aria-hidden="true"></i></label>

                <div id='history-list' class="history-list">
                </div>

                <div  class="history-dataset-list">
                </div>
            </div> 

            <div class="help-section">
            </div>
        </div>
    </div>
    
    <div class="nbtools-footer"></div>
    <div class="nbtools-buttons">
        <button class="nbtools-run" type="button" data-traitlet="run_label"></button>
    </div>`;

    this.dragged = '';
    this.KernelOutPut = '';
    this.JOBID = {};
    this.file_cache = [];
    this.galaxy_file_cache = []
    this.test = []
    this.conditional_name = []
    }
 
    render() {

        super.render();
        const inputs = this.model.get('inputs')
        //########################
        this.add_history_list()
        //########################
        this.form_builder(inputs['inputs'])
        this.add_dataset_table()
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
        this.AddHelpSection(inputs['help'])
    }

    un_wrap_repeat(input, name){

        var self = this
        var out 

        for (var i = 0; i < input.length; i++ ){

            if (input[i]['type'] == 'repeat' && input[i]['name'] == name){
                out = input[i]
            } else if (input[i]['type'] == 'conditional' ){
                for (var  j = 0; j < input[i].test_param.options.length; j++){ 
                    if (input[i].test_param.options[j][1] == input[i].test_param.value){
                        if (self.un_wrap_repeat(input[i]['cases'][j].inputs, name) != undefined){
                            out = self.un_wrap_repeat(input[i]['cases'][j].inputs, name)
                        }
                    }
                }
            } else if (input[i]['type'] == 'section' ){
                if (self.un_wrap_repeat( input[i].inputs, name) != undefined){
                    out = self.un_wrap_repeat( input[i].inputs, name)
                }

            } else if (input[i]['type'] == 'repeat' && input[i]['name'] != name) {
                if (self.un_wrap_repeat( input[i].inputs, name) != undefined){
                    out = self.un_wrap_repeat( input[i].inputs, name)
                }
            }
        }
        if (out != null){
            return out 
        }
    }

    un_wrap(input, name){

        var self = this
        var out  

        for (var i = 0; i < input.length ; i++){
            if (input[i]['type'] == 'conditional' ){
                if (input[i]['name'] ==  name){
                   out = input[i]
                } else {
                    for (var  j = 0; j < input[i]['cases'].length; j++){      
                        if (self.un_wrap(input[i]['cases'][j]['inputs'], name) != undefined){
                            out = self.un_wrap(input[i]['cases'][j]['inputs'], name)
                        } 
                    }
                }
                
            } else  if (input[i]['type'] == 'repeat' ) {
                if (self.un_wrap(input[i]['inputs'], name) != undefined){
                    out = self.un_wrap(input[i]['inputs'], name)
                } 

            } else if (input[i]['type'] == 'section'){
                if (self.un_wrap(input[i]['inputs'], name) != undefined){
                    out = self.un_wrap(input[i]['inputs'], name)
                } 
            }
        }

        if (out != null){
            return out 
        }
    }

    form_builder(inputs, call_back_data={}, parent='', el_name='') {

        var self = this
        var tool_form = this.el.querySelector('.tool-forms')
        var form_parent = this.el.querySelector('.Galaxy-form');
        form_parent.id = `galaxy-form-${this.uid()}`

        form_parent.data = this.model.get('gal_instance')['url']
    
        if (form_parent == null){
            var form_parent = document.createElement('form')
            form_parent.className = 'Galaxy-form'
        }

        _.each(inputs, (input) => {
            self.add(input, form_parent, '', call_back_data, el_name);
        });

        tool_form.append(form_parent)
    }

    uid(){
        top.__utils__uid__ = top.__utils__uid__ || 0;
        return `uid-${top.__utils__uid__++}`;
    }

    add(input, form_parent, name_prefix, data={}){

        var input_def = input;

        if (input_def.id == 'undefined') {
            input_def.id = this.uid()
        }

        switch (input_def.type) {
            case "conditional":  
                this.add_conditional_section(input_def, form_parent, name_prefix, data);
                break;
            case "data":
                this.add_input_data(input_def, form_parent, name_prefix, data)
                break
            case "integer" :
            case  "float" :
            case "text":
                this.add_text(input_def, form_parent, name_prefix)
                break
            case "boolean":
                this.add_boolean_field(input_def, form_parent, name_prefix)
                break
            case "select":
                this.add_select_field(input_def, form_parent, name_prefix)
                break
            case "data_collection":
                this.add_input_data(input_def, form_parent, name_prefix, data)
                break
            case "repeat":  
                this.add_repeat_section(input_def, form_parent, name_prefix) 
                break
            case "section":
                this.add_section(input_def, form_parent, name_prefix) 
                break
            case "drill_down":
                this.add_drill_down_section(input_def, form_parent, name_prefix)
                break
            case "data_upload":
                this.data_upload_tool(form_parent)
                break
        }
    }
    // remove() {
    //     super.remove();
    //     // Clean up data files from the cache
    //     for (let f of this.file_cache)
    //         ContextManager.data_registry.unregister({ data: f });
    // }

    async data_upload(gp_tool_list, dataset) {

        var self = this
        
        this.removeAllChildNodes(gp_tool_list)
        var Nodes1 =  document.querySelector('body').querySelectorAll('.nbtools.nbtools-uibuilder.lm-Widget.p-Widget')

        for (var i = 0; i < Nodes1.length; i++){
            if (Nodes1[i].querySelectorAll('.nbtools-fileinput').length > 0){

                var tool  = document.createElement('div')
                tool.className = 'gp_tool'

                var tool_name  = document.createElement('div')
                tool_name.className = 'tool_name'
                var tool_label  = document.createElement('div')
                tool_label.className = 'tool_label_text'
                tool_label.innerHTML = Nodes1[i].querySelector('.nbtools-title').innerHTML

                tool_name.append(tool_label)
                tool.append(tool_name)

                var tool_id =  Nodes1[i].querySelector('.nbtools-title').innerText
                var tool_input_params  = document.createElement('div')
                tool_input_params.className = 'tool-input-params'

                var InputFiles =  Nodes1[i].querySelectorAll('.nbtools-fileinput') 

                var uri = {}

                for (var j = 0; j < InputFiles.length; j++){

                    var param_list = document.createElement('ul')
                    param_list.className = 'tool-param-ul'
    
                    tool_input_params.append(param_list)
                    tool.append(tool_input_params)

                    var UID = this.uid()

                    var input_file_param = document.createElement('div')
                    input_file_param.className = 'input-data-param'
                    var input_file_param_label = document.createElement('div')
                    input_file_param_label.className = 'input-data-param-label'
                    var targetid =  InputFiles[j].querySelector('input').id
                    input_file_param_label.id = targetid+'-label'

                    input_file_param_label.addEventListener("click", async (e)=> {

                    e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'block'

                   if (self.file_exist(dataset)){
                  
                        document.getElementById(`${e.target.id.replace('-label', '')}`).value =  self.file_exist(dataset)
                        document.getElementById(`${e.target.id.replace('-label', '')}`).dispatchEvent(new Event('change', { bubbles: true }));  

                        e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'none'
                        e.target.parentNode.parentNode.querySelector('.fas.fa-solid.fa-check').style.display = 'block'

                   } else{

                        e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'block'

                        uri = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.send_data_to_gp_server(file_name=${JSON.stringify(dataset['name'])}, tool_id=${JSON.stringify(tool_id)}, dataset_id=${JSON.stringify(dataset['id'])}, server=${JSON.stringify(this.model.get('gal_instance')['url'])}, ext=${JSON.stringify(dataset['file_ext'])})`)

                        e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'none'
                        e.target.parentNode.parentNode.querySelector('.fas.fa-solid.fa-check').style.display = 'block'

                        dataset['uri'] = uri['uri']
                        this.file_cache.push(new Data(origin, dataset['uri'], dataset['id'], dataset['file_ext']));
                        ContextManager.data_registry.register({ data: this.file_cache[ this.file_cache.length-1] })
                        document.getElementById(`${e.target.id.replace('-label', '')}`).value =  uri['uri']
                        document.getElementById(`${e.target.id.replace('-label', '')}`).dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    })

                    input_file_param_label.innerHTML =  InputFiles[j].querySelector('.lm-Widget.p-Widget.jupyter-widgets.widget-label').innerHTML
                    input_file_param.append(input_file_param_label)

                    var status_icon_div = document.createElement('div')
                    status_icon_div.className = 'gpticon'
                    status_icon_div.style.float  = 'left'
                    status_icon_div.style.margin = '5px'
                    status_icon_div.style.marginTop = '0px'

                    var status_icon = document.createElement('i')
                    status_icon.className = "fas fa-spinner fa-spin"
                    status_icon.id = `status-icon-${UID}-${j}`
                    status_icon.style.display = 'none'

                    var status_icon_1 = document.createElement('i')
                    status_icon_1.className = "fas fa-solid fa-check"
                    status_icon_1.style.display = 'none'
                    status_icon_1.id = `status-icon-check-${UID}-${j}`

                    status_icon_div.append(status_icon)
                    status_icon_div.append(status_icon_1)

                    param_list.append(status_icon_div)
                    param_list.append(input_file_param)
                }
                gp_tool_list.append(tool)
            }
        }
    }

    add_DataCollectionToolParameter(input_def, FormParent, NamePrefix){

        input_def.id = this.uid()
        var self = this

        const row = document.createElement('div')
        row.className =  'ui-form-element section-row'
        row.id =  this.uid()

        var options 
        options = input_def['options']['hdca']

        const select = document.createElement('select')
        select.id = `select-${input_def.id}`  
        select.className = 'data_collection'   
        select.name = NamePrefix+input_def['name']
    
        for(var i = 0; i < options.length; i++) {

            const el = document.createElement("option");

            if (input_def['type'] != 'data_collection'){
                const opt = options[i][0];
                el.value =  options[i][1];
                el.textContent = opt;
            } else{
                const opt = options[i]['name'];
                el.value =  JSON.stringify(options[i]);
                el.textContent = opt;
            }
            select.appendChild(el);

            if(input_def.value == options[i][1]){
                el.selected = 'true'
            }
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

        const help = document.createElement('div')
        help.className = 'ui-from-help'
        const helpSpan = document.createElement('span')
        helpSpan.className = "ui-form-help-text"
        helpSpan.innerHTML = `<b> Help:</b> ${input_def['help']}`
        helpSpan.style.fontWeight = 'normal'
        helpSpan.style.display = 'inline'
        help.style.marginBottom = '10px'
        help.style.marginLeft = '10px'

        help.append( helpSpan)
        row.append(help)

        select.addEventListener("change", async () => {
            var queryID = select.value
            if (input_def['is_dynamic'] == true){

                var children = self.el.querySelector('.Galaxy-form')
                var inputs = self.get_form_data(children)
                var history_id = self.el.querySelector('.galaxy-history-list').querySelector('#history_ids').value
                var refine_inputs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(self.model.get('gal_instance')['url'])}, json.loads('${JSON.stringify(inputs)}'), ${JSON.stringify(self.model.get('galaxy_tool_id'))}, ${JSON.stringify(history_id)})`)
                var form_parent = self.el.querySelector('.Galaxy-form')

                self.removeAllChildNodes(form_parent)
                self.form_builder(refine_inputs['inputs'])
            }

        });
    
        FormParent.append(row)
        return row
    }


    extract_input_dom(form){

        var self = this
        var input_list = []

        if (form.className == 'Galaxy-form' || form.className.includes('ui-portlet-section') || form.className.includes('ui-repeat') || form.className.includes('pl-2') || form.className.includes('sections') ){

            for ( var i = 0; i < form.children.length; i++ ){
                if ( self.extract_input_dom(form.children[i]) != undefined) {
                    input_list = input_list.concat( self.extract_input_dom(form.children[i]))
                }
            }
            
        } else {

            if ( form.querySelector('.InputDataFile') != null) {
                var el_id = {}
                el_id['name'] = form.querySelector('.InputDataFile').name
                el_id['id'] = form.querySelector('.InputDataFile').id
                el_id['element_name'] = form.querySelector('.InputDataFile').parentNode.parentNode.querySelector('.ui-form-title-text').innerText
                input_list.push(el_id)
            }
        }
 
        if (input_list.length > 0 ) {
            return input_list
        }
    }

    get_form_data(form, checking){

        var self = this
        var out = {}

        if (form.className == 'Galaxy-form' || form.className.includes('ui-portlet-section') || form.className.includes('ui-repeat') || form.className.includes('pl-2') || form.className.includes('sections')) {
            for (var j = 0; j < form.children.length; j++){
                if (self.get_form_data(form.children[j], checking) == 'error') {
                    return 'error'
                } else{
                    Object.assign(out,  self.get_form_data(form.children[j], checking))
                }
            }
        } else if (form.querySelector('.InputData')){
            if (checking == 'on'){
                if (form.querySelector('.InputData').value == "") {
                    form.querySelector('.InputData').style.backgroundColor = 'pink'
                    return 'error'
                } else {
                    form.querySelector('.InputData').style.backgroundColor = ''
                    out[form.querySelector('.InputData').name] =  form.querySelector('.InputData').value
                }
            } else {
                out[form.querySelector('.InputData').name] =  form.querySelector('.InputData').value
            }
           
        } else if (form.querySelector('.outer-checkbox-div')){

            var select_list = []

            if (checking == 'on' && form.querySelector('.outer-checkbox-div')['data-value'] != null ) {

                for (var k = 0; k < form.querySelector('.outer-checkbox-div').children.length; k++ ) {
                    if (form.querySelector('.outer-checkbox-div').children[k].querySelector('.InputDataCheckbox').checked) {
                        form.querySelector('.outer-checkbox-div')['data-value'] = true
                        select_list.push(form.querySelector('.outer-checkbox-div').children[k].querySelector('.InputDataCheckbox').value)
                    }
                }

                if (select_list.length == 0 ){
                    form.querySelector('.outer-checkbox-div').children[0].querySelector('.InputDataCheckbox').parentNode.style.backgroundColor = 'pink' 
                } else{
                    form.querySelector('.outer-checkbox-div').children[0].querySelector('.InputDataCheckbox').parentNode.style.backgroundColor = ''
                }
            }

            if (checking == 'on' && form.querySelector('.outer-checkbox-div')['data-value'] != null ) {
                if (select_list.length == 0){
                    form.querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').style.backgroundColor = 'pink'
                    return 'error'
                } else {
                    form.querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').style.backgroundColor = ''
                    out[form.querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').name] = select_list
                }
            } else {

                if (form.querySelector('.outer-checkbox-div')['data-value'] == null && select_list.length == 0 ){
                    out[form.querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').name] = null
                } else{
                    if (form.querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox')){
                        out[form.querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').name] = select_list
                    }
                }
            }

        } else if (form.querySelector('.InputDataFile')){

            if (checking == 'on') {

                if (form.querySelector('.InputDataFile').options.length  == 0 ){
                    form.querySelector('.InputDataFile').style.backgroundColor = 'pink'
                    return 'error'
                } else{
                    form.querySelector('.InputDataFile').style.backgroundColor = ''

                    var input_data = form.querySelector('.InputDataFile').parentElement['data-file']
                    var input_files = []
        
                    for (var i = 0; i < form.querySelector('.InputDataFile').options.length; i++) {
                        if (form.querySelector('.InputDataFile').options[i].selected == true) {
                            input_files.push(JSON.parse(form.querySelector('.InputDataFile').options[i].value))
                        }
                    }
                    
                    out[form.querySelector('.InputDataFile').name] = input_data 
    
                    if (input_files.length == 1 && input_files[0]['id'] == ''){
                        out[form.querySelector('.InputDataFile').name] = null
                    } else{
                        input_data['values'] = input_files
                        out[form.querySelector('.InputDataFile').name] = input_data
                    }
                }

            } else {

                var input_data = form.querySelector('.InputDataFile').parentElement['data-file']
                var input_files = []
    
                for (var i = 0; i < form.querySelector('.InputDataFile').options.length; i++) {
                    if (form.querySelector('.InputDataFile').options[i].selected == true) {
                        input_files.push(JSON.parse(form.querySelector('.InputDataFile').options[i].value))
                    }
                }
                
                out[form.querySelector('.InputDataFile').name] = input_data 

                if (input_files.length == 1 && input_files[0]['id'] == ''){
                    out[form.querySelector('.InputDataFile').name] = null
                } else{
                    input_data['values'] = input_files
                    out[form.querySelector('.InputDataFile').name] = input_data
                }
            }

        } else if(form.querySelector('.drill-down.container')) {

           var drill_down_inputs = []

            for(var n = 0; n < form.querySelector('.drill-down.container').querySelectorAll('input').length; n++) {
                if (form.querySelector('.drill-down.container').querySelectorAll('input')[n].checked) {
                    drill_down_inputs.push(form.querySelector('.drill-down.container').querySelectorAll('input')[n].value)
                }
            }
            out[form.querySelector('.drill-down.container').name] =  drill_down_inputs

        } else if (form.querySelector('.data_collection')){
           
            var input_files = []  

            out[form.querySelector('.data_collection').name] = input_files  

            for (var i = 0; i < form.querySelector('.data_collection').options.length; i++) {
                if (form.querySelector('.data_collection').options[i].selected == true) {
                    input_files.push(form.querySelector('.data_collection').options[i].data)
                }
            }

            if (checking == 'on') {
                if (out[form.querySelector('.data_collection').name].length < 1 ){
                    form.querySelector('.data_collection').style.backgroundColor = 'pink'
                    return 'error'
                }
                else {
              
                    form.querySelector('.data_collection').style.backgroundColor = ''
                    out[form.querySelector('.data_collection').name] = input_files

                    form.querySelector('.data_collection').parentElement['data-file']['values'] = input_files
                    out[form.querySelector('.data_collection').name] = form.querySelector('.data_collection').parentElement['data-file']
                }
            } else {

                if (input_files.length == 0){
                    form.querySelector('.data_collection').parentElement['data-file']['values'] = [{}]
                } else{
                    form.querySelector('.data_collection').parentElement['data-file']['values'] = input_files
                }
                
                out[form.querySelector('.data_collection').name] = form.querySelector('.data_collection').parentElement['data-file']
            }
        }

        if (Object.keys(out).length > 0){
            return out  
        }
    }

    galaxy_data_verify(file_cache, id) {

        for (var i = 0; i < file_cache.length; i++){
            if (file_cache[i]['label'][0]  == id) {
                return true
            } 
        } 
        return false
    }

    return_element(form, identifier){

        var input_list = this.extract_input_dom(form)

        for(var i = 0; i < input_list.length; i++) {

            if (identifier == input_list[i]['element_name']) {
                return input_list[i]
            }
        }
    }

    async galaxy_data_upload(gp_tool_list, dataset, server) {

        var self = this
        this.removeAllChildNodes(gp_tool_list)
        var nodes =  document.querySelector('body').querySelectorAll('.Galaxy-form')

        for (var i = 0; i < nodes.length; i++){

            var title =  nodes[i].parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.nbtools-title').innerText
            var server_id = nodes[i].data
            var extracted_dom = self.extract_input_dom(nodes[i])

            if (extracted_dom != undefined) {
                if (extracted_dom.length > 0) {

                    var tool  = document.createElement('div')
                    tool.className = 'g_tool'
    
                    var tool_input_params  = document.createElement('div')
                    tool_input_params.className = 'tool-input-params'
                    tool_input_params.id = `g-tool-${nodes[i].id}`
    
                    var tool_name  = document.createElement('div')
                    tool_name.className = 'tool_name'
    
                    var tool_label  = document.createElement('div')
                    tool_label.className = 'tool_label_text'
                    
                    tool_label.innerHTML =  `<b>${title}</b>`
    
                    tool_name.append(tool_label)
                    tool.append(tool_name)
                    tool.append(tool_input_params)
                    gp_tool_list.append(tool)

                    for (var j = 0; j < extracted_dom.length; j++) {

                        var UID = this.uid()

                        var param_list = document.createElement('ul')
                        param_list.className = 'tool-param-ul'

                        var input_file_param = document.createElement('div')
                        input_file_param.className = 'input-data-param'

                        var input_file_param_label = document.createElement('div')
                        input_file_param_label.className = 'input-data-param-label'
                        input_file_param_label.id = `${extracted_dom[j]['id']}-label`
                        input_file_param_label.data = server_id

                        input_file_param_label.innerText = self.extract_input_dom(nodes[i])[j]['element_name']
                        input_file_param.append(input_file_param_label)

                        var g_icon = document.createElement('div')
                        g_icon.className  = 'gpicon'
                        g_icon.style.float = 'left'
                        g_icon.style.margin = '0px 5px 5px'

                        var g_icon_spin = document.createElement('i')
                        g_icon_spin.className = 'fas fa-spinner fa-spin'
                        g_icon_spin.id = `status-icon-uid-${UID}-${j}` 
                        g_icon_spin.style.display = 'none'

                        var g_icon_check = document.createElement('i')
                        g_icon_check.className = 'fas fa-solid fa-check'
                        g_icon_check.id = `status-icon-check-${UID}-${j}` 
                        g_icon_check.style.display = 'none'

                        g_icon.append(g_icon_spin)
                        g_icon.append(g_icon_check)
                        param_list.append(g_icon)
                        param_list.append(input_file_param)
                        tool_input_params.append(param_list)

                        input_file_param_label.addEventListener("click", async (e) => {

                            e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'block'
                            e.target.parentNode.parentNode.querySelector('.fas.fa-solid.fa-check').style.display = 'none'

                            if (server == e.target.data){
                                e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'none'
                                e.target.parentNode.parentNode.querySelector('.fas.fa-solid.fa-check').style.display = 'block'

                                if (dataset['extension'] == null){
                                    dataset['extension'] = dataset['name'].split('.')[1]
                                }

                                if(dataset['file_ext'] ){
                                    dataset['extension'] = dataset['file_ext']
                                }

                                self.galaxy_file_cache.push(new Data(e.target.data, [dataset['name'], 'NA'], [dataset['id'], 'NA'], dataset['extension']));

                                const el = document.createElement("option");
                                el.textContent = dataset['name'];

                                el.value = dataset['id']

                                el.data = {'id': dataset['id'], 'src':dataset['hda_ldda']}
                                el.selected = true
                                el.dispatchEvent(new Event('change', { bubbles: true }))

                                var form = document.querySelector(`#${e.target.parentNode.parentNode.parentNode.id.replace('g-tool-','')}`)
                             
                                for (var l = 0; l < self.extract_input_dom(form).length; l++) {
                                    if ( self.extract_input_dom(form)[l]['id'] == e.target.id.replace('-label', '') ) {
                                        document.querySelector(`#${ e.target.id.replace('-label', '')}`).append(el)
                                    }
                                }

                            } else {

                                if (self.galaxy_data_verify(self.galaxy_file_cache, dataset['id']) == false) {

                                    if (dataset['extension'] == null){
                                        dataset['extension'] = dataset['name'].split('.')[1]
                                    }
    
                                    if(dataset['file_ext'] ){
                                        dataset['extension'] = dataset['file_ext']
                                    }

                                    var form = document.querySelector(`#${e.target.parentNode.parentNode.parentNode.id.replace('g-tool-','')}`)
                                    var hi = form.parentNode.querySelector('#history_ids').value

                                    var uri = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.send_data_to_galaxy_tool(server_d=${JSON.stringify(server)}, server_u=${JSON.stringify(e.target.data)}, dataset_id=${JSON.stringify(dataset['id'])}, ext=${JSON.stringify(dataset['extension'])}, history_id=${JSON.stringify(hi)})`)

                                    for (let i = 0; i < Infinity; ++i) {

                                        var out = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(e.target.data)},  dataset_id=${JSON.stringify(uri['outputs'][0]['id'])})`)

                                        await this.waitforme(5000);
        
                                        if (out['state'] === 'ok') {

                                            e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'none'
                                            e.target.parentNode.parentNode.querySelector('.fas.fa-solid.fa-check').style.display = 'block'

                                            if (dataset['extension'] == null){
                                                dataset['extension'] = dataset['name'].split('.')[1]
                                            }

                                            self.galaxy_file_cache.push(new Data(e.target.data, [dataset['name'], out['name']], [dataset['id'], out['id']], dataset['extension']));

                                            const el = document.createElement("option");

                                            console.log(out)
                                
                                            el.textContent = dataset['name'];
                                            el.value = JSON.stringify({'id': out['id'], 'src':out['hda_ldda']})
                                            el.data = {'id': out['id'], 'src':out['hda_ldda']}
                                            el.selected = true
                                            el.dispatchEvent(new Event('change', { bubbles: true }))

                                            var form = document.querySelector(`#${e.target.parentNode.parentNode.parentNode.id.replace('g-tool-','')}`)
                                        
                                            for (var l = 0; l < self.extract_input_dom(form).length; l++) {
                                                if ( self.extract_input_dom(form)[l]['id'] == e.target.id.replace('-label', '') ) {
                                                    document.querySelector(`#${ e.target.id.replace('-label', '')}`).append(el)
                                                }
                                            }

                                            break;
                                        }  
                                    }

                                } else {

                                    for (var k = 0; k < self.galaxy_file_cache.length; k++){
                                        if (self.galaxy_file_cache[k]['label'][0] == dataset['id']) {

                                            const el = document.createElement("option");
                                       
                                            el.textContent = dataset['name'];
                                            el.value = out['id']
                                            el.data = {'id': out['id'], 'src':out['hda_ldda']}
                                            el.selected = true
                                            el.dispatchEvent(new Event('change', { bubbles: true }))
                            
                                            var form = document.querySelector(`#${e.target.parentNode.parentNode.parentNode.id.replace('g-tool-','')}`)
                            
                                            for (var l = 0; l < self.extract_input_dom(form).length; l++) {
                                                if ( self.extract_input_dom(form)[l]['id'] == e.target.id.replace('-label', '') ) {
                                                    document.querySelector(`#${ e.target.id.replace('-label', '')}`).append(el)
                                                }
                                            }
                                        }
                                    }

                                    e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'none'
                                    e.target.parentNode.parentNode.querySelector('.fas.fa-solid.fa-check').style.display = 'block'
                                }
                            }
                        })
                    }
                }
            }
        }
    }

    file_exist(dataset){
        if (this.file_cache.length  > 0) {
            for (var k = 0; k < this.file_cache.length; k++){
                if (this.file_cache[k]['label'] == dataset['id']) {
                    return this.file_cache[k]['uri']
                }
            }
         }
         else{
             return false
         }
         return false
    }

    drill_down(options){

        var OuterDrillDown = document.createElement('div')

        for (var i = 0; i<options.length; i++){

            const Icon = document.createElement('span')
            Icon.className = 'icon fa mr-1 fa-plus'
   
            Icon.style.marginRight = '2px'
            Icon.style.padding = '2px'

            Icon.addEventListener('click', (e) => {

                if(e.target.parentNode.parentNode.querySelector('.subgroup').style.display == 'none') {
                    e.target.parentNode.parentNode.querySelector('.subgroup').style.display = 'block'
                } else{
                    e.target.parentNode.parentNode.querySelector('.subgroup').style.display = 'none'
                }

                if (Icon.className == 'icon fa mr-1 fa-plus') {
                    Icon.className = 'icon fa mr-1 fa-minus'
                } else{
                    Icon.className = 'icon fa mr-1 fa-plus'
                }
            })

            const Innerdiv  = document.createElement('div')
            Innerdiv.className = 'options'
            
            const subgroup = document.createElement('div')
            subgroup.className = 'subgroup'
            subgroup.style.display = 'none'

            var Input = document.createElement('input')
            Input.type = 'checkbox'
            Input.style.marginRight = '4px'
            Input.value = options[i].value
            
            var InputID = `input-id-${this.uid()}`

            var Label = document.createElement('label')
            Label.setAttribute('for', InputID)
            Label.innerText = options[i]['name']

            if (options[i]['options'].length !== 0){
                Innerdiv.append(Icon)
            }

            Innerdiv.append(Input)
            Innerdiv.append(Label)
            
            OuterDrillDown.append(Innerdiv)
            OuterDrillDown.append(subgroup)

            var div4 = document.createElement('div')
            div4.className = 'Main'
            div4.style.marginLeft = '20px'

            div4.append(Innerdiv)
            div4.append(subgroup)

            OuterDrillDown.append(div4)

            if (options[i]['options'].length !== 0 ) {
               subgroup.append(this.drill_down(options[i]['options']))
            }
        }
        return OuterDrillDown
    }

    add_drill_down_section(input_def, FormParent, NamePrefix){

        input_def.id = this.uid()

        const container = document.createElement('div')
        container.className = 'ui-options-list drilldown-container'

        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'

        const selectspan = document.createElement('span')
        selectspan.className = "select-ui-form-title-text"
        selectspan.textContent = 'Select all'
        selectspan.style.display = 'inline'
        selectspan.style.marginLeft = '5px'

        const Unselect = document.createElement('span')
        Unselect.className = "unselect-ui-form-title-text"
        Unselect.textContent = 'Unselect all'
        Unselect.style.display = 'inline'
        Unselect.style.marginLeft = '5px'

        const Input = document.createElement('input')
        Input.type = 'checkbox'
        const select_lable = document.createElement('div')
        select_lable.className = 'select-unselect'
        select_lable.style.marginLeft = '20px'

        select_lable.append(Unselect)
        select_lable.append(selectspan)

        const row = document.createElement('div')
        row.className = 'ui-form-element section-row'
        row.id = input_def.id

        var Div2 = document.createElement('div')
        Div2.className = 'drill-down container'

        Div2.name = NamePrefix+input_def['name']
        
        row.append(TitleSpan)
        row.append(select_lable)
        row.append(Div2)

        Div2.append(this.drill_down(input_def.options))

        selectspan.addEventListener('click', () => {

            for (var i = 0; i < Div2.querySelectorAll('.subgroup').length; i++ ) {
                Div2.querySelectorAll('.subgroup')[i].style.display = 'block'
            }

            for (var i = 0; i < Div2.querySelectorAll('input').length; i++) {
                Div2.querySelectorAll('input')[i].checked = 'true'
            }

            for (var i = 0; i < Div2.querySelectorAll('span').length; i++ ){
                Div2.querySelectorAll('span')[i].className = 'icon fa mr-1 fa-minus'
            }
        })

        Unselect.addEventListener('click', () => {

            for (var i = 0; i < Div2.querySelectorAll('.subgroup').length; i++ ) {
                Div2.querySelectorAll('.subgroup')[i].style.display = 'none'
            }

            for (var i = 0; i < Div2.querySelectorAll('input').length; i++) {
                Div2.querySelectorAll('input')[i].checked = 'false'
                Div2.querySelectorAll('input')[i].click()
            }

            for (var i = 0; i < Div2.querySelectorAll('span').length; i++ ){
                Div2.querySelectorAll('span')[i].className = 'icon fa mr-1 fa-plus'
            }
        })

        FormParent.append(row)
        return row
    }

    add_text (input_def, FormParent, NamePrefix){
 
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

        const help = document.createElement('div')
        help.className = 'ui-from-help'
        const helpSpan = document.createElement('span')
        helpSpan.style.fontWeight = 'normal'
        helpSpan.className = "ui-form-help-text"
        helpSpan.innerHTML = `<b> Help:</b> ${input_def['help']}`
        helpSpan.style.display = 'inline'
        help.style.marginLeft = '10px'
        help.style.marginBottom = '10px'

        help.append( helpSpan)
       
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        title.style.float = 'left'

        row.append(title)
        row.append(input)
        row.append(help)

        FormParent.append(row)
        return row
    }


    add_integer (input_def, FormParent, NamePrefix){
 
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

        const help = document.createElement('div')
        help.className = 'ui-from-help'
        const helpSpan = document.createElement('span')
        helpSpan.style.fontWeight = 'normal'
        helpSpan.className = "ui-form-help-text"
        helpSpan.innerHTML = `<b> Help:</b> ${input_def['help']}`
        helpSpan.style.display = 'inline'
        help.style.marginLeft = '10px'
        help.style.marginBottom = '10px'

        help.append( helpSpan)
       
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        title.style.float = 'left'

        row.append(title)
        row.append(input)
        row.append(help)

        FormParent.append(row)
        return row
    }

    add_float (input_def, FormParent, NamePrefix){
 
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

        const help = document.createElement('div')
        help.className = 'ui-from-help'
        const helpSpan = document.createElement('span')
        helpSpan.style.fontWeight = 'normal'
        helpSpan.className = "ui-form-help-text"
        helpSpan.innerHTML = `<b> Help:</b> ${input_def['help']}`
        helpSpan.style.display = 'inline'
        help.style.marginLeft = '10px'
        help.style.marginBottom = '10px'

        help.append( helpSpan)
       
        title.append(TitleSpan)
        row.className = 'ui-form-element section-row'
        row.id = input_def.id
        title.style.float = 'left'

        row.append(title)
        row.append(input)
        row.append(help)

        FormParent.append(row)
        return row
    }

    async data_upload_tool(FormParent) {

        var data_upload = `
                        <div class="upload_tab">
                         
                           <div class="tab">
                                <button type="button" id="resumable_upload_button" class="tablinks" >Upload</button>
                                <button type="button" class="tablinks">From URL</button>
                                <button type="button" class="tablinks">Create data</button>
                           </div>


                            <!-- Tab content -->
                            <div id="upload" class="tabcontent">
                                <div style="margin-top:10px"><div style="float: left;"><p class="resumable-upload-title"><b>Upload file to the Galaxy server.</b></p></div><div class="upload-status-icon" style="float:left; margin-top:5px; margin-left:5px; display: none;"><i class="fa fa-spinner fa-spin" style="font-size:10px; float:left;"></i></div></div>
                                <input id="inputupload" class="input_upload" type="file" style="display: block" >
                                <div class="resumable-upload-warning" style="display: none;"> <b>Warning:</b> CORS error, file uploaded through bioblend API..</div>
                            </div>
                    
                            <div id="from_url" class="tabcontent" style="display: none;">
                                <p><b>Upload file from a URL to the Galaxy server.</b></p> 
                                <input class="input_upload" >
                            </div>
                            
                            <div id="create_data" class="tabcontent" style="display: none;">
                                <p><b>Create a data file and upload to the Galaxy server.</b></p>
                                <textarea class="input_upload" style="height: 30vh; width: 45vw;" >
                                Example test for testing
                                </textarea>
                            </div>
                        </div>`

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


        utm.querySelector('.available-sessions')

        var datatypes_genomes = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.get_data_type_and_genomes(server=${JSON.stringify(this.model.get('gal_instance')['url'])})`)

        var Input = utm.querySelector('#inputupload')

        this.Upload_callback(Input)

        var datatypeSelect = document.createElement('select')
        datatypeSelect.className = 'datatypes_options'

        var auto_opt = document.createElement("option");
        auto_opt.textContent = auto_opt.value = 'auto';
        datatypeSelect.appendChild(auto_opt);
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

        var self = this
        axios.post(`${credentials['url']}/api/tools/fetch`, payload, {

            headers: {
                'x-api-key': this.model.get('gal_instance')['api_key'],
              }
        })
            .then((response) => {
                self.resumable(response['data']['outputs'][0])
                console.log('ok')
            })
        
            .catch((error) => {
                console.log(error);
            });
    }

    async resumable (data){

        var HistoryID = this.el.querySelector('#history_ids').value
        var state

        var e = this.el.querySelector('.list-item')
        e.parentElement.removeChild(e)
        var DHL = this.el.querySelector('#dataset-history-list')
        var DataListdiv = this.el.querySelector('.history-dataset-list');

        for (var i = 0; i < DHL.options.length; i++ ){
            if (DHL[i].value == HistoryID) {
                DHL.selectedIndex = i
            }
        }
        
        DataListdiv.append(await this.data_row_list(this.model.get('gal_instance')['url'], HistoryID ))
        var ListItem =  this.el.querySelector('.list-item')
        data['type_id'] =`dataset-${data['id']}` 
        this.add_dataset(ListItem, this.data_row_list, HistoryID)
    }

    NewTusUpload(data){

        var self = this
        var elm = this.el.querySelector('#inputupload')
        var rp = this.el.querySelector('.resumable-upload-title')
        var title = document.createElement('p')
        title.className = 'upload-title'
        var Parent = elm.parentElement
        title.style.marginTop  = '20px'

        Parent.prepend(title)
      
        var chunkSize = 10485760;
        var file = data.files[0];
        var credentials = this.model.get('gal_instance')
        data['key'] =  credentials['api_key']

        var upload = new tus.Upload(file, {
            endpoint: `${credentials['url']}/api/upload/resumable_upload/`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            chunkSize: chunkSize,

            metadata: {
                filename: file.name,
                filetype: file.type,
            },
            headers: {
                'x-api-key': credentials['api_key'],
            },
            
            onError: function(error) {

                self.readFile()
                console.log("Failed because: " + error)
        
            },

            onProgress: function(bytesUploaded, bytesTotal) {
                var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
                console.log(bytesUploaded, bytesTotal, percentage + "%")

                title.innerText = `Uploading file ${upload.file.name,  percentage + "%"}` 

                var btn = self.el.querySelector('#resumable_upload_button')
                btn.innerHTML = 'Uploading '

                var i = document.createElement('i')
                i.className = 'fa fa-spinner fa-spin'
                btn.append(i)
            },

            onSuccess: function() {
                console.log("Download %s from %s", upload.file.name, upload.url)

                var btn = self.el.querySelector('#resumable_upload_button')
                self.removeAllChildNodes(btn)
                btn.innerHTML = "Upload"

                data[`files_${0}|file_data`] = {
                    session_id: upload.url.split("/").at(-1),
                    name: upload.file.name,
                };

                title.parentElement.removeChild(title)

                delete data["files"]

                elm.style.display = 'block'
                self.submitPayload(data, credentials)
                this.el.querySelector('#inputupload').value = null
                this.el.querySelector('.upload-status-icon').style.display = 'none'
            }
        })
        // Check if there are any previous uploads to continue.
        upload.findPreviousUploads().then(function (previousUploads) {
            // Found previous uploads so we select the first one. 
            if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0])
            }
            upload.start()
        })
  
    }

    readFile() {

        this.el.querySelector('.resumable-upload-warning').style.display = 'block'
        this.el.querySelector('.resumable-upload-warning').style.color = 'red'

        var elm = this.el.querySelector('#inputupload')
        var hi = this.el.querySelector('#history_ids').value

        const file = elm.files.item(0);
        const reader = new FileReader();
        
        reader.onload = async () => {

           var out  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.CORS_fallback_upload(file_name=${JSON.stringify(file['name'])}, data=${JSON.stringify(reader.result)}, server=${JSON.stringify(this.model.get('gal_instance')['url'])}, history_id=${JSON.stringify(hi)})`);
           this.el.querySelector('#inputupload').value = null

           var data_list_div = this.el.querySelector('.history-dataset-list');
           var e = this.el.querySelector('.list-item')
           e.parentElement.removeChild(e)
           data_list_div.append(await this.data_row_list(this.model.get('gal_instance')['url'], hi))
   
           var hl = this.el.querySelector('#dataset-history-list')
   
           for (var i = 0; i <  hl.options.length; i++ ){
               if (hl[i].value == hi) {
                   hl.selectedIndex = i
               }
           }

           this.el.querySelector('.upload-status-icon').style.display = 'none'
        }
        reader.readAsText(file);
    }

    Upload_callback(input){

        var self  = this
        var children = this.element.querySelector('.Galaxy-form')

        this.el.querySelectorAll('.nbtools-run').forEach((button) => button.addEventListener('click', () => {
           
            this.el.querySelector('.resumable-upload-warning').style.display = 'none'
            this.el.querySelector('.upload-status-icon').style.display = 'block'
            
            var cnf = {};

            var data = {
                "history_id": self.element.querySelector('#history_ids').value,
                "targets": [
                    {
                        "destination": {
                            "type": "hdas"
                        },
                        "elements": [
                            {
                                "src": "files",
                                "name":  input.files[0]['name'],
                                "dbkey": children.querySelector('.genomes_options').value,
                                "ext": children.querySelector('.datatypes_options').value,
                            }
                        ]
                    }
                ],
                'files': input.files,
            }
            self.NewTusUpload(data)
        }));
    }

   async dataupload_job( uplood_status='', HistoryID='' ) {
        // this.hide_run_buttons(true)
        var children = this.element.querySelector('.Galaxy-form')
        var upload_link 
        var upload_method

        for (var i = 0; i < children.querySelectorAll('.tabcontent').length; i++ ) {
            if (children.querySelectorAll('.tabcontent')[i].style.display == 'block') {
                upload_link = children.querySelectorAll('.tabcontent')[i].querySelector('.input_upload').value
                upload_method = children.querySelectorAll('.tabcontent')[i].querySelector('.input_upload').type
            }
        }

        var datatype = children.querySelector('.datatypes_options').value
        var genome = children.querySelector('.genomes_options').value
        var history_id = this.el.querySelector('#history_ids').value

        var InitialData = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.upload_dataset(file_path=${JSON.stringify(upload_link)}, upload_method=${JSON.stringify(upload_method)}, datatype=${JSON.stringify(datatype)}, genome=${JSON.stringify(genome)}, server=${JSON.stringify(this.model.get('gal_instance')['url'])}, HistoryID=${JSON.stringify(history_id)} )`);
       
        var DHL = this.el.querySelector('#dataset-history-list')
        var DataListdiv = this.el.querySelector('.history-dataset-list');
        
       for (var i = 0; i <  DHL.options.length; i++ ){
            if (DHL[i].value == history_id) {
                DHL.selectedIndex = i
            }
        }

        var e = this.el.querySelector('.list-item')
        e.parentElement.removeChild(e)
        DataListdiv.append(await this.data_row_list(this.model.get('gal_instance')['url'], history_id ))

        var ListItem =  DataListdiv.querySelector('.list-item')
        var data = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.OutPutData(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, JobID=${JSON.stringify(InitialData['jobs'][0]['id'])} )`);
       
        await this.dataset_row_ok_state(ListItem, data[0],  history_id)
    }

    async add_dataset_table(selected_value='default'){

        var self = this

        const options =  this.model.get('history_ids')
        const select = document.createElement('select')

        select.id = `dataset-history-list`  
        select.className = 'InputData'   

        var DataListdiv = this.el.querySelector('.history-dataset-list');
        DataListdiv.append(await this.data_row_list(this.model.get('gal_instance')['url'], options[0]['id']))
     
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

        select.addEventListener("change", async () => {

            if (this.model.get('galaxy_tool_id') != 'GiN_data_upload_tool'){

                var form = self.element.querySelector('.Galaxy-form')
                var Inputs = self.get_form_data(form)
                var refine_inputs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(server=${JSON.stringify(self.model.get('gal_instance')['url'])}, tool_inputs=json.loads('${JSON.stringify(Inputs)}'), tool_id=${JSON.stringify(self.model.get('galaxy_tool_id'))}, history_id=${JSON.stringify(select.value)})`)
                var FormParent = self.el.querySelector('.Galaxy-form')    
                self.removeAllChildNodes(FormParent)
                var selected_index = {}
                selected_index['HID'] = select.selectedIndex
                self.form_builder(refine_inputs['inputs'],  selected_index) 
            }
 
            var history_id = select.value

            var e = self.el.querySelector('.list-item')
            e.parentElement.removeChild(e)

            DataListdiv.append(await this.data_row_list(this.model.get('gal_instance')['url'], history_id))
        });

        var update = self.element.querySelector('#dataset-update-label')

        update.addEventListener('click', async() => {

            self.removeAllChildNodes(DataListdiv)
            var history_id = select.value

            DataListdiv.append(await this.data_row_list(this.model.get('gal_instance')['url'], history_id))
        })

        var DataList = this.el.querySelector('#history-list')
        DataList.append(select)
    }

    add_history_list(selected_value='default'){

        var self = this

        const options =  this.model.get('history_ids')
        const select = document.createElement('select')
        select.id = `history_ids`  
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

        select.addEventListener("change", async () => {
 
            var history_id = select.value

            if (this.model.get('inputs')['id'] != 'GiN_data_upload_tool') {
                var form = self.element.querySelector('.Galaxy-form')
                var inputs = self.get_form_data(form)
                var refine_inputs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(self.model.get('gal_instance')['url'])}, json.loads('${JSON.stringify(inputs)}'), ${JSON.stringify(self.model.get('galaxy_tool_id'))}, ${JSON.stringify(history_id)})`)
                var FormParent = self.el.querySelector('.Galaxy-form')    
                self.removeAllChildNodes(FormParent)
                var selected_index = {}
                selected_index['HID'] = select.selectedIndex
                self.form_builder(refine_inputs['inputs'],  selected_index)  
            }
        });

        var HistoryList = this.el.querySelector('.galaxy-history-list')
        HistoryList.append(select)
    }

    AddHelpSection(help){

        var self = this

        var helpSection = this.element.querySelector('.help-section')
        var HelpContent = document.createElement('div')
        HelpContent.className = 'help-content'
        HelpContent.innerHTML = help
        HelpContent.style.display = 'none'

        this.basics.className = 'help-button-title'
        var HelpButton = document.createElement('button')
        HelpButton.className = 'help-button'
        HelpButton.textContent = 'Help Section'

        helpSection.append(HelpButton)
        helpSection.append(HelpContent)

        var imgs = HelpContent.getElementsByTagName("img");
        for (var i = 0; i < imgs.length; i++) {
            const imgsrc = imgs[i].getAttribute("src");
            const imgsrcL = imgsrc.toLowerCase();
            if( !imgsrcL.startsWith("http:") &&  !imgsrcL.startsWith("https:") && !imgsrcL.startsWith("data")){
                imgs[i].src = new URL(imgsrc, self.model.get('gal_instance')['url']).href;
            }
        }

        HelpButton.addEventListener("click", function() {

            let nextSibling = HelpButton.nextElementSibling;   

            if (nextSibling.style.display == 'none'){
                nextSibling.style.display = 'block'
            } else {
                nextSibling.style.display = 'none'
            }
          });
    }

    add_repeat_section(input_def, FormParent, NamePrefix){

        var self = this
        input_def.id = this.uid()

        var SuffixName = input_def['name']
        var Button = document.createElement('button')
        Button.innerText = `Insert ${input_def['title']}`
        Button.className = 'RepeatButton'
        Button.type = "button"

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

        const outtitle = document.createElement('div')
        outtitle.className = 'ui-from-title'
        const outTitleSpan = document.createElement('span')
        outTitleSpan.className = "ui-form-title-text"
        outTitleSpan.textContent = input_def['title']
        outTitleSpan.style.display = 'inline'
        outTitleSpan.style.marginLeft = '10px'
        outtitle.append(outTitleSpan)

        const help = document.createElement('div')
        help.className = 'ui-from-help'
        const helpSpan = document.createElement('span')
        helpSpan.className = "ui-form-help-text"
        helpSpan.textContent = input_def['help']
        helpSpan.style.display = 'inline'
        help.append( helpSpan)
        help.style.marginBottom = '10px'
        help.style.margin = '10px'

        row.className = 'ui-repeat section-row'
        row.id = input_def.id

        FormParent.append(outtitle)
        FormParent.append(row)
        FormParent.append(Button)
        FormParent.append(help)

        var click = input_def['min'];

        function add_internal_repeat(inputs, count){

            const row1 = document.createElement('div')
            row1.className = 'internal-ui-repeat section-row'
            row1.dataset.value = count
            row1.id = NamePrefix+SuffixName+`_${count}`

            var DeleteButton = document.createElement('button')
            DeleteButton.innerHTML = ('<i class="fa fa-trash-o" aria-hidden="true"></i>')
            DeleteButton.className = 'delete-button'
            DeleteButton.type = "button"

            const InnerTitle = document.createElement('div')
            InnerTitle.className = 'repeat-ui-from-title'
            InnerTitle.append(DeleteButton)

            const InnerTitleSpan = document.createElement('span')
            InnerTitleSpan.className = "ui-form-title-text"
            InnerTitleSpan.textContent = `${count+1}: `+input_def['title']
            InnerTitleSpan.style.display = 'inline'
            InnerTitle.append(InnerTitleSpan)

            row1.append(InnerTitle)

            for (var j in inputs){
                self.add(inputs[j], row1, NamePrefix+SuffixName+`_${count}|`)
            } 

            DeleteButton.addEventListener("click", async function(e){ 

                var del =  e.target.parentNode.parentNode.parentNode
                delete input_def.cache[del.dataset.value]
          
                var form = self.element.querySelector('.Galaxy-form')
                var inputs = self.get_form_data(form)

                var history_id = self.el.querySelector('.galaxy-history-list').querySelector('#history_ids').value
                var refine_inputs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(self.model.get('gal_instance')['url'])}, json.loads('${JSON.stringify(inputs)}'), ${JSON.stringify(self.model.get('galaxy_tool_id'))}, ${JSON.stringify(history_id)})`)
    
                var selected_index = {}
                selected_index['HID'] = history_id    
    
                var up_input_def = self.un_wrap_repeat(refine_inputs['inputs'],  input_def['name'])
                delete up_input_def.cache[del.dataset.value]

                self.removeAllChildNodes(row)

                if (Object.keys(up_input_def.cache).length > 0 ){
                    up_input_def['min'] = Object.keys(up_input_def.cache).length
                    for (var j = 0; j < Object.keys(up_input_def.cache).length; j++){
                        add_internal_repeat(up_input_def.cache[Object.keys(up_input_def.cache)[j]], j)
                    }
                }
            });

            row.append(row1)
        }

        if (Object.keys(input_def.cache).length > 0 ){
            input_def['min'] = Object.keys(input_def.cache).length
            for (var j = 0; j < Object.keys(input_def.cache).length; j++){
                add_internal_repeat(input_def.cache[Object.keys(input_def.cache)[j]], j)
            }

        } else{

            if (input_def['min'] > 0){
                for (var x =0; x < input_def['min']; x++) {
                    add_internal_repeat(input_def['inputs'], x)  
                }
            } 
        }
        
        Button.addEventListener("click", async (e)=>{ 
            var Count = row.children.length
            add_internal_repeat(input_def['inputs'], Count)
        });

        DeleteButton.addEventListener("click", async function(e){ 
            self.el.querySelector('.delete-button').closest('.internal-ui-repeat.section-row').remove()
        });

        return row
    }
      
    get_repeat_params(input, name){
        var self = this
        var out  

        for (var i = 0; i < input.length ; i++){
            if (input[i].model_class == 'Repeat'){
                if(input[i].name == name){
                   return input[i]
                }
            } 
            else if (input[i].model_class == 'Conditional') {
                for(var j = 0; j < input[i].cases.length; j++){
                    return self.get_repeat_params(input[i].cases[j].inputs, name)
                }
            }
            else if (input[i].model_class == 'Section') {
                return self.get_repeat_params(input[i].inputs, name)
            }
        }
        return out
    }

    removeAllChildNodes(parent){
         while (parent.firstChild) {
             parent.removeChild(parent.firstChild);
         }
    }

    add_input_data(input_def, FormParent, NamePrefix, call_back_data={}){ 

        if (input_def.optional == true) {
            if (input_def.options.hda.length == 0){
                input_def.options.hda.push({'name':'No dataset is available', 'id':'', 'hid':''})
            } else{
                input_def.options.hda.push({'name':'Nothing selected', 'id': '', 'hid':''})
            }

            if (input_def.options.hdca.length == 0) {
                input_def.options.hdca.push({'name':'No dataset collection is availabl', 'id':'', 'hid':''})
            } else{
                input_def.options.hdca.push({'name':'Nothing selected', 'id':'', 'hid':''})
            }
        }

        input_def.id = this.uid()
        var self = this
        const row = document.createElement('div')
        row.className = 'ui-form-element section-row'
        row.id =  NamePrefix+input_def['name']

        var FileManu = document.createElement('div')
        FileManu.className = 'multi-selectbox'
        FileManu.style.width = '100%'

        FileManu['data-file'] =  {"values":[], "batch":false}

        var Select = document.createElement('select')
        Select.className = 'InputDataFile'

        var select_input_mode = `<div class="ui-radiobutton" >
                                    <label id="data-file-input" role="button" class="ui-option" data-original-title="" title=""><i class="fa fa-file-o no-padding"></i><input type="radio" name="uid-64" value="0" style="display: none;" /></label>
                                    <label id="batch-file-input" role="button" class="ui-option" data-original-title="" title=""><i class="fa fa-files-o no-padding"></i><input type="radio" name="uid-64" value="1" style="display: none;" /></label>
                                    <label id="collection-data-input" role="button" class="ui-option" data-original-title="" title=""><i class="fa fa-folder-o no-padding"></i><input type="radio" name="uid-64" value="2" style="display: none;" /></label>
                                </div>`

        const sim = new DOMParser().parseFromString(select_input_mode, 'text/html').querySelector('.ui-radiobutton')

        sim.querySelector('#data-file-input').style.background = 'white'
        
        var Label = sim.querySelectorAll('.ui-option')

        if (input_def.multiple == true ){
            Select.multiple = true
            Select.style.height = '200px'
            sim.querySelector('#data-file-input').style.display = 'none'
        }

        Label.forEach((button)=> button.addEventListener('click', (e) => {

            for (var i = 0; i < Label.length; i++){
                if (Label[i] == button){
                    Label[i].style.background = 'white';
                } else{
                    Label[i].style.background = 'rgb(218,217,215)';
                }
            } 
        }))

        if (input_def.type != 'data_collection') {
            Select.style.width = '100%'
            FileManu.append(sim)
        } else{
            
        }

        Select.name = NamePrefix+input_def['name']

        Select.value = input_def.value

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

        const help = document.createElement('div')
        help.className = 'ui-from-help'
        const helpSpan = document.createElement('span')
        helpSpan.className = "ui-form-help-text"
        helpSpan.innerHTML = `<b> Help:</b> ${input_def['help']}`
        helpSpan.style.fontWeight = 'normal'
        helpSpan.style.display = 'inline'
        help.style.marginBottom = '10px'
        help.style.marginLeft = '10px'
        help.append( helpSpan)

        FileManu.append(Select)

        const data_descriptor = document.createElement('div')
        data_descriptor.className = 'data-descriptor-label'
        data_descriptor.style.display = 'none'
        data_descriptor.style.width = '100%'
        data_descriptor.style.height = '20px'
        data_descriptor.style.marginLeft = '10px'
        data_descriptor.innerHTML = `<div> <i class="fa fa-sitemap"></i> This is a batch mode input field. Separate jobs will be triggered for each dataset selection.</div>`
        FileManu.append(data_descriptor)

        FileManu.style.width = '100%'

        row.append(title)
        row.append(FileManu)
        row.append(help)

        if (input_def.type == 'data_collection'){
            for (var i = 0; i < options['hdca'].length; i++) {
                const el = document.createElement("option");
                if (input_def['options']['hdca'].length !== 0) {
                    options['hdca'][i].hid = `${options['hdca'][i].hid}`
                    el.textContent = options['hdca'][i].hid+" "+options['hdca'][i].name;
                    el.value = JSON.stringify(options['hdca'][i])
                    delete options['hdca'][i].keep
                }
                Select.appendChild(el);
            }

        } else {
            for (var i = 0; i < options['hda'].length; i++) {
                const opt = document.createElement("option");
                if (input_def['options']['hda'].length !== 0) {
                    opt.textContent = options['hda'][i].hid+" "+options['hda'][i].name;
                    delete options['hda'][i].keep
                    opt.value = JSON.stringify(options['hda'][i])
                }
                Select.appendChild(opt);
            }
        }

        sim.querySelector('#data-file-input').addEventListener('click', (e) => {

            FileManu.querySelector('.data-descriptor-label').style.display = 'none'

            FileManu['data-file']['batch'] = false

            Select.multiple = false

            self.removeAllChildNodes(Select)

            for (var i = 0; i < options['hda'].length; i++) {
                const el = document.createElement("option");
                if (input_def['options']['hda'].length !== 0) {
                    el.textContent = options['hda'][i].hid+options['hda'][i].name;
                    delete options['hda'][i].keep
 
                    if(options['hda'][i]['id'] == ''  ){
                        el.data = JSON.stringify("") 
                    } else{
                        el.value = JSON.stringify(options['hda'][i])
                    }
                }
                Select.appendChild(el);
            }
        })

        sim.querySelector('#batch-file-input').addEventListener('click', (e) => {

            FileManu.querySelector('.data-descriptor-label').style.display = 'block'

            FileManu['data-file']['batch'] = true
            Select.multiple = true

            self.removeAllChildNodes(Select)

            for (var i = 0; i < options['hda'].length; i++) {
                const el = document.createElement("option");
                if (input_def['options']['hda'].length !== 0) {
                    el.textContent = options['hda'][i].hid+options['hda'][i].name;
                    delete options['hda'][i].keep 
                    if (options['hda'][i]['id'] == ''  ){
                        el.data = JSON.stringify("") 
                    } else{
                        el.value = JSON.stringify(options['hda'][i])
                    }
                }
                Select.appendChild(el);
            }
        })

        sim.querySelector('#collection-data-input').addEventListener('click', (e) => {

            FileManu.querySelector('.data-descriptor-label').style.display = 'block'

            Select.multiple = false

            FileManu['data-file']['batch'] = true

            self.removeAllChildNodes(Select)

            for (var i = 0; i < options['hdca'].length; i++) {
                const el = document.createElement("option");
                if (input_def['options']['hdca'].length !== 0) {
                    el.textContent = options['hdca'][i].hid+" "+options['hdca'][i].name; 
                    el.value = JSON.stringify(options['hdca'][i])
                    delete options['hdca'][i].keep 
                }
                Select.appendChild(el);
            }
        })
        

        if (input_def.value == null && input_def.optional == true){
            Select.options[Select.options.length-1].selected = true
        } else {
                if (input_def.value != null) {
                    for (var i = 0; i < Select.options.length; i++) {
                        for (var k = 0; k < input_def.value.values.length; k++ ) {   
                            if (input_def.value.values[k] != null) { 
                                if (JSON.parse(Select.options[i].value)['id'] == input_def.value.values[k]['id']){
                                    Select.options[i].selected = true
                                }
                            }
                        }
                    }
                }
        } 

        Select.addEventListener("dragover", function(event) {
            event.preventDefault();
        }, false);

        Select.id = `input-data-${this.uid()}`

        Select.addEventListener("drop", function(event) {

            event.preventDefault();

            if (event.target.className == "InputDataFile") {
                event.target.style.background = "";
                var draged_item = self.dragged

                var dataID = JSON.parse(self.dragged.querySelector('.title').getAttribute('data-value'))
                var name = self.dragged.querySelector('.name').innerText
                var hid = self.dragged.querySelector('.hid').innerText

                const opt = `${hid}${name}`
                const el = document.createElement("option");

                el.textContent = opt;

                if (dataID[1] == 'collection'){
                    el.value = JSON.stringify({"id":dataID[0], "src":"hdca"})
                } else {
                    el.value = JSON.stringify({"id":dataID[0], "src":"hda"}) 
                } 

                Select.prepend(el);

                Select.selectedIndex = 0
            }
        }, false);

        Select.addEventListener("change", async (e) => {

            if (Select.multiple == true || FileManu['data-file']['batch'] == 'true'){

            } else{

                FileManu['data-file']['id'] = JSON.parse(Select.value)

                var children = self.el.querySelector('.Galaxy-form')
                var inputs = self.get_form_data(children)

                var history_id = self.el.querySelector('.galaxy-history-list').querySelector('#history_ids').value
                var refine_inputs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(self.model.get('gal_instance')['url'])}, json.loads('${JSON.stringify(inputs)}'), ${JSON.stringify(self.model.get('galaxy_tool_id'))}, ${JSON.stringify(history_id)})`)

                var FormParent = self.el.querySelector('.Galaxy-form')
                self.removeAllChildNodes(FormParent)
                self.form_builder(refine_inputs['inputs'])
            }

        }, false);

        FormParent.append(row)
        return row
    }

  
    add_select_field(input_def, FormParent, NamePrefix){

        input_def.id = this.uid()
        var self = this

        const row = document.createElement('div')
        row.className =  'ui-form-element section-row'
        row.id =  this.uid()

        if (input_def.display == 'checkboxes') {

            const TitleSpan = document.createElement('span')
            TitleSpan.className = "ui-form-title-text"
            TitleSpan.textContent = input_def.label
    
            const OuterDiv = document.createElement('div')
            OuterDiv.className =  'outer-checkbox-div'

            if (input_def.optional == true) { 
                OuterDiv['data-value'] = null
            } else {
                OuterDiv['data-value'] = true
            }

            const selectspan = document.createElement('span')
            selectspan.className = "select-ui-form-title-text"
            selectspan.textContent = 'Select all'
            selectspan.style.display = 'inline'
            selectspan.style.marginLeft = '5px'
    
            const Unselect = document.createElement('span')
            Unselect.className = "unselect-ui-form-title-text"
            Unselect.textContent = 'Unselect all'
            Unselect.style.display = 'inline'
            Unselect.style.marginLeft = '5px'
    
            const Input = document.createElement('input')
            Input.type = 'checkbox'
            const select_lable = document.createElement('div')
            select_lable.className = 'select-unselect'
            select_lable.style.marginLeft = '20px'

            select_lable.append(Unselect)
            select_lable.append(selectspan)

            selectspan.addEventListener('click', () => {
                for (var i = 0; i < OuterDiv.querySelectorAll('input').length; i++ ) {
                    OuterDiv.querySelectorAll('input')[i].checked = 'true'
                    // OuterDiv.querySelectorAll('input')[i].click()
                }
            })
    
            Unselect.addEventListener('click', () => {
                for (var i = 0; i < OuterDiv.querySelectorAll('input').length; i++ ) {
                    OuterDiv.querySelectorAll('input')[i].checked = 'false'
                    OuterDiv.querySelectorAll('input')[i].click()
                }
            })

            row.append(TitleSpan)
            row.append(select_lable)
            row.append(OuterDiv)

            for(var i = 0; i < input_def.options.length; i++) {

                const CheckBoxDiv = document.createElement('div')
                CheckBoxDiv.className = 'ui-checkbox-div'

                const CheckboxLabel = document.createElement('label')
                CheckboxLabel.className = 'ui-checkbox-label'
                CheckboxLabel.htmlFor = `select-${input_def.id}-${i}`
                CheckboxLabel.innerText = input_def.options[i][0]

                const CheckBoxInput = document.createElement('input')
                CheckBoxInput.className = 'InputDataCheckbox'

                CheckBoxInput.id = `select-${input_def.id}-${i}`
                CheckBoxInput.value = input_def.options[i][1]
                CheckBoxInput.type = 'checkbox'
                CheckBoxInput.name = NamePrefix+input_def['name']

                CheckBoxDiv.append(CheckBoxInput)
                CheckBoxDiv.append(CheckboxLabel)
                OuterDiv.append(CheckBoxDiv)
            }
        } 
        else {
            var options 

            if (input_def['type'] == 'data_collection'){
                options = input_def['options']['hdca']

            } else{
                options =  input_def['options']
            }

            const select = document.createElement('select')
            select.id = `select-${input_def.id}`  
            select.className = 'InputData'   
            select.name = NamePrefix+input_def['name']
        
            for(var i = 0; i < options.length; i++) {

                const el = document.createElement("option");

                if (input_def['type'] != 'data_collection'){
                    const opt = options[i][0];
                    el.value =  options[i][1];
                    el.textContent = opt;
                } else{
                    const opt = options[i]['name'];
                    el.value =  JSON.stringify(options[i]);
                    el.textContent = opt;
                }
                select.appendChild(el);

                if(input_def.value == options[i][1]){
                    el.selected = 'true'
                }
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

            const help = document.createElement('div')
            help.className = 'ui-from-help'
            const helpSpan = document.createElement('span')
            helpSpan.className = "ui-form-help-text"
            helpSpan.innerHTML = `<b> Help:</b> ${input_def['help']}`
            helpSpan.style.fontWeight = 'normal'
            helpSpan.style.display = 'inline'
            help.style.marginBottom = '10px'
            help.style.marginLeft = '10px'

            help.append( helpSpan)
            row.append(help)

            select.addEventListener("change", async () => {

                var queryID = select.value

                if (input_def['is_dynamic'] == true){

                    var children = self.el.querySelector('.Galaxy-form')
                    var inputs = self.get_form_data(children)
                    var history_id = self.el.querySelector('.galaxy-history-list').querySelector('#history_ids').value
                    var refine_inputs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(self.model.get('gal_instance')['url'])}, json.loads('${JSON.stringify(inputs)}'), ${JSON.stringify(self.model.get('galaxy_tool_id'))}, ${JSON.stringify(history_id)})`)
                    var form_parent = self.el.querySelector('.Galaxy-form')
    
                    self.removeAllChildNodes(form_parent)
                    self.form_builder(refine_inputs['inputs'])
                }
            });
        }
        FormParent.append(row)
        return row
    }

    add_boolean_field (input_def, FormParent, NamePrefix ){

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

        const help = document.createElement('div')
        help.className = 'ui-from-help'
        const helpSpan = document.createElement('span')
        helpSpan.className = "ui-form-help-text"
        helpSpan.innerHTML = `<b> Help:</b> ${input_def['help']}`
        helpSpan.style.fontWeight = 'normal'
        helpSpan.style.display = 'inline'
        help.style.marginBottom = '10px'
        help.style.marginLeft = '10px'

        help.append(helpSpan)
        row.append(title)
        row.append(select)
        row.append(help)
        
        this.el.querySelector('.nbtools-form').append(row)
        FormParent.append(row)
        return row
    }

    collect_data() {
        const Childrens  = this.el.querySelector('.nbtools-form').children;
    }

    async add_conditional_section(input_def, parent, NamePrefix, call_back_data={}){
        // ########################################################
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
        parent.append(row)
 
         var NewNamePrefix = NamePrefix+input_def['name']+"|"
         input_def.id = this.uid()
 
         var  ConditionalDiv
 
         ConditionalDiv = document.createElement('div')
         ConditionalDiv.className = 'ui-form-element section-row pl-2'
         ConditionalDiv.id = this.uid()
 
         for( var i = 0; i < input_def['test_param']['options'].length; i++ ) {
             if (input_def['test_param'].value == input_def['cases'][i]['value']) {
                 for (var j in input_def.cases[i].inputs) {
                     this.add(input_def.cases[i].inputs[j], ConditionalDiv, NewNamePrefix, call_back_data)
                     input_def.cases[i].inputs[j].id = this.uid()
                 }
             }
         }
 
        select.addEventListener("change", async () => {

        var self = this

        var queryID = select.value
        var form = self.element.querySelector('.Galaxy-form')
        var inputs = self.get_form_data(form)

        self.removeAllChildNodes(ConditionalDiv)

        var history_id = self.element.querySelector('#history_ids').value 
        var refine_inputs = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(self.model.get('gal_instance')['url'])}, json.loads('${JSON.stringify(inputs)}'), ${JSON.stringify(self.model.get('galaxy_tool_id'))}, ${JSON.stringify(history_id)})`)
        
        this.conditional_name = input_def['name']

        var input_def1 = this.un_wrap(refine_inputs['inputs'], this.conditional_name)

            for (var l in input_def1.cases){
                if  (input_def1.cases[l].value == queryID) {
                    for (var j in input_def1.cases[l].inputs) {
                        this.add(input_def1.cases[l].inputs[j], ConditionalDiv, NewNamePrefix, call_back_data),  
                        input_def1.cases[l].inputs[j].id = this.uid()
                    }
                }
            }
        });
 
        parent.append(ConditionalDiv)
    }
 
    add_section (input_def, parent, NamePrefix){

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
        parent.append(UpperDiv)

        function section(){
            for (var j in input_def['inputs']){
                self.add(input_def['inputs'][j], ConditionalDiv, NewNamePrefix)
            }
        }

        if (input_def['expanded']){
            section()
        }

        Button.addEventListener("click", function (e) {

            if (ConditionalDiv.childNodes.length == 0){
                section()
            } else{
                self.removeAllChildNodes(ConditionalDiv)
            }
            e.preventDefault();
        });
    }

    waitforme (milisec){
        return new Promise(resolve => {
            setTimeout(() => { resolve('') }, milisec);
        })
    }

    async data_row_list (server, history_id){
        var data_list = document.createElement('ul')
        data_list.className = 'list-item'
        data_list.style.overflow = 'auto'
        data_list.style.height = '600px'
        data_list.style.overflowX = 'scroll'
        data_list.style.overflowY = 'scroll'
    
        var datasets = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.history_data_list(server=${JSON.stringify(server)}, history_id=${JSON.stringify(history_id)} )`) 

        for (var i = 0; i < datasets.length; i++){
            if (datasets[i]['history_content_type'] == 'dataset') {
                 this.add_dataset(data_list, datasets[i], history_id)
            } 
            else if (datasets[i]['history_content_type'] == 'dataset_collection') {
                data_list.append( await this.dataset_collection_row_state (datasets[i], history_id))
            }
        }
        return data_list
    }


    async dataset_collection_row_state (dataset, history_id){

        var self = this

        if (dataset.collection_type == "list:paired"){
            dataset.collection_type_title =  `a list of pairs with ${dataset.element_count} items`
        } else if (dataset.collection_type == "list") {
            dataset.collection_type_title =  `a list of ${dataset.element_count} items`
        } else if (dataset.collection_type == 'paired') {
            dataset.collection_type_title =  `a dataset pair with ${dataset.element_count} items`
        }       

        if (dataset['populated_state'] == 'ok'){
            var pop_state = dataset['populated_state']
 
            var row = `<div id="${dataset['type_id']}"   class="list-item ${dataset['history_content_type']} history-content state-${pop_state}" >
                        <div class="warnings"></div>
                        <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                        <div class="primary-actions">
                            <a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a>
                        </div>
                        <div class="title-bar clear"  tabindex="0" draggable="true" ondragstart="event.dataTransfer.setData('text/plain',null) > 
                            <span class="state-icon"></span>
                            <div class="title" data-value=${JSON.stringify([dataset['id'], dataset['type']])} > 
                                <span class="hid">${dataset['hid']}: </span> <span class="name">${dataset['name']}</span>
                            </div>
                            <br>
                            <div> ${dataset.collection_type_title}</div>
                        </div>

                        <div id="add_data_share_menu" style="display: none;"  class="add_data_share_menu" >
                            <div class="send-data-genepattern-tools"> 
                                <div class="gt" >  Send data to Galaxy  <i class="fa fa-refresh" aria-hidden="true"></i></div>
                                <div class="galaxy-tool-list" style="display: none"> 
                                </div>
                                
                                <div class="gpt" >  Send data to GenePattern  <i class="fa fa-refresh" aria-hidden="true"></i></div>
                                <div class="genepattern-tool-list" style="display: none"> 
                                </div>
                            </div>
                        </div>
                        
                        <div class="list-items"  style="display: none; border: solid white 2px; margine; margin: 20px; "></div>
                    </div>`
            
            const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector(`.list-item.${dataset['history_content_type']}.history-content.state-${pop_state}`)

            var exch  = Tbl.querySelector('.fa.fa-exchange')
            var gp_tools = Tbl.querySelector('.gpt')
            var g_tools = Tbl.querySelector('.gt')

            Tbl.querySelector('.title').myData = {'jai':0}

            var states = ['new', 'queued', 'running']

            if (states.includes(dataset['populated_state'])){
                for (let i = 0; i < Infinity; ++i) {

                    var dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_dataset_collection(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(dataset['id'])} )`)
    
                    if ( dataset['populated_state'] == 'new'  ){
                        Tbl.className = `list-item ${dataset['history_content_type']} history-content state-new`
                        Tbl.style.background = '#7d959d70'
                    }   
    
                    else if (dataset['populated_state'] == 'queued' ){
                        Tbl.className = `list-item ${dataset['history_content_type']} history-content state-queued`
                        Tbl.style.background = '#7d959d70'
                    } 
    
                    else if(dataset['populated_state'] == 'running'){
                        if(Tbl.querySelector('.fa.fa-clock-o')){
                            Tbl.querySelector('.fa.fa-clock-o').remove()
                        }
                        
                        Tbl.style.background = '#ffe6cd'
                        Tbl.className = `list-item ${dataset['history_content_type']} history-content state-running`
                    }
    
                    await this.waitforme(2000);
    
                    if ( dataset['populated_state'] == 'ok' ) {
                        Tbl.style.background = '#C2EBC2'
                        Tbl.className = `list-item ${dataset['history_content_type']} history-content state-ok`
                        
                        if (Tbl.querySelector('.primary-actions')){
                            Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a>`
                        }
                        break;
                    }  
                    
                    else if (dataset['populated_state'] == 'error'){
                        Tbl.style.background = '#f4a3a5'
                        Tbl.className = `list-item ${dataset['history_content_type']} history-content state-error`
                       
                        if (Tbl.querySelector('.primary-actions')){
                            Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
                        }
                        break;
                    }     
                }

            }

            if (exch){
                    exch.addEventListener("click", async (event) =>{ 

                    if (Tbl.querySelector('#add_data_share_menu').style.display == 'block') {
                        Tbl.querySelector('#add_data_share_menu').style.display = 'none'
                    } 
                    else{
                        Tbl.querySelector('#add_data_share_menu').style.display = 'block'
                    }
                })
            }

            g_tools.addEventListener("click", (e) => {

                // var server =  Tbl.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
                // var server =  Tbl.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
                var server =  Tbl.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
                var gp_tools_div = Tbl.querySelector('.galaxy-tool-list')
    
                this.galaxy_data_upload(gp_tools_div, dataset, server)
    
                if (Tbl.querySelector('.galaxy-tool-list').style.display == 'block') {
                    Tbl.querySelector('.galaxy-tool-list').style.display = 'none'
                } 
                else{
                    Tbl.querySelector('.galaxy-tool-list').style.display = 'block'
                }
            })
    
            gp_tools.addEventListener("click", (e) => {
    
                var gp_tools_div = Tbl.querySelector('.genepattern-tool-list')
    
                this.data_upload(gp_tools_div, dataset)
    
                if (gp_tools_div.childNodes.length == 0){
                    var div = document.createElement('div')
                    var msg = document.createElement('p')
                    div.append(msg)
                    msg.innerText = '  No tools are available..'
                    gp_tools_div.append(div)
                } 
    
                if (Tbl.querySelector('.genepattern-tool-list').style.display == 'block') {
                    Tbl.querySelector('.genepattern-tool-list').style.display = 'none'
                } 
                else{
                    Tbl.querySelector('.genepattern-tool-list').style.display = 'block'
                }
            })
    
            Tbl.querySelector('.name').addEventListener('click', async (e) => {

                var URL = this.model.get('gal_instance')['url']
                var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_dataset_collection(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(dataset['id'])} )`) 
          
                if (show_dataset.collection_type == 'list'){
                    if (Tbl.querySelector('.list-items').children.length == 0){
                        for(var i = 0; i < show_dataset.elements.length;  i++){
                            show_dataset.elements[i]['object']['hid'] = i
                            show_dataset.elements[i]['object']['hid'] = i
                            show_dataset.elements[i]['object']['name'] = show_dataset.elements[i]['element_identifier']
                            await self.add_dataset(Tbl.querySelector('.list-items'), show_dataset.elements[i]['object'], history_id)
                        }
                    }

                } else if (show_dataset.collection_type == 'list:paired'){
                    if (Tbl.querySelector('.list-items').children.length == 0){
                        for(var i = 0; i < show_dataset.elements.length;  i++){
                            Tbl.querySelector('.list-items').append(await self.dataset_collection_list_pairs (show_dataset.elements[i], history_id))
                        }
                    }
                } else{
                    if (Tbl.querySelector('.list-items').children.length == 0){
                        for(var i = 0; i < show_dataset.elements.length;  i++){
                            show_dataset.elements[i]['object']['hid'] = i
                            show_dataset.elements[i]['object']['name'] = show_dataset.elements[i]['element_identifier']
                            await self.add_dataset(Tbl.querySelector('.list-items'), show_dataset.elements[i]['object'], history_id)
                        }
                    }
                }

                if (Tbl.querySelector('.list-items').childNodes.length > 0) {
                } else{
                    Tbl.querySelector('.list-items').append(await self.dataset_collection_list_item(show_dataset))
                }

                if (Tbl.querySelector('.list-items').style.display == 'block') {
                    Tbl.querySelector('.list-items').style.display = 'none'
                } else{
                    Tbl.querySelector('.list-items').style.display = 'block'
                }
            });

        var title = Tbl.querySelector('.title-bar.clear')

        var dragged

            title.addEventListener("dragstart", (event) => {
                this.dragged = event.target;
            }, false);

            var download = Tbl.querySelector('.fa.fa-download')

            if (download){
                download.addEventListener('click', () => {
                    KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(collection_id=${JSON.stringify(show_dataset['id'])}, server=${JSON.stringify(this.model.get('gal_instance')['url'])}, file_name=${JSON.stringify(dataset['name'])}, data_type='collection')`);
                })
            }

            self.delete_dataset(Tbl, dataset['id'],  history_id, 'collection')
            return Tbl

        } else{
            //Need to be fixed: a separate dataaset_collection error widget  
            dataset['populated_state'] = 'error'
            dataset['history_content_type'] = 'dataset'
            return this.dataset_row_error_state(dataset, history_id)
        }
    } 

    add_data_share_menu ( ){

        var row = `<div id="add_data_share_menu" style="display: none;"  class="add_data_share_menu" >
                        <h1> Hi </h1>
                    </div>`
        
        const data_share_menu = new DOMParser().parseFromString(row, 'text/html')
        return data_share_menu.querySelector('#add_data_share_menu')
    }

    dataset_collection_list_pairs(dataset, history_id){

        var self = this

        var row = `<div id="dataset_collection-${dataset['id']}" class="list-item dataset-collection dataset-collection-element state-ok">
                            <div class="warnings">
                            </div>
                            <div class="selector">
                                <span class="fa fa-2x fa-square-o"></span>
                            </div>
                            <div class="primary-actions"></div>
                            <div class="title-bar clear" tabindex="0" draggable="true">
                                <div class="title">
                                <span class="name">${dataset['element_identifier']}</span>
                                </div>
                                <div class="subtitle">a pair of datasets</div>
                            </div>
                            <div class="details"></div>
                    
                            <div class="list-items"  style="display: none; border: solid white 2px; margine; margin: 20px; "></div>
                    </div>`

                    const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector(`.list-item.dataset-collection.dataset-collection-element.state-ok`)

                    Tbl.querySelector('.name').addEventListener('click', async (e) => {

                        if (Tbl.querySelector('.list-items').style.display == 'block') {
                            Tbl.querySelector('.list-items').style.display = 'none'
                        } else{
                            Tbl.querySelector('.list-items').style.display = 'block'
                        }

                        if (Tbl.querySelector('.list-items').children.length == 0){

                            for(var i = 0; i < dataset['object']['elements'].length;  i++){
                                dataset['object']['elements'][i]['object']['hid'] = i
                                dataset['object']['elements'][i]['object']['hid'] = i
                                dataset['object']['elements'][i]['object']['name'] = dataset['object']['elements'][i]['element_identifier']
                                    await self.add_dataset(Tbl.querySelector('.list-items'), dataset['object']['elements'][i]['object'], history_id)
                                }
                            }
                    })
        return Tbl
    }

    async add_dataset (parent, dataset, history_id){

        var URL = this.model.get('gal_instance')['url']

        var row = `<div id="${dataset['type_id']}"   class="list-item ${dataset['history_content_type']} history-content state-${dataset['state']}" >
                        <div class="warnings"></div>
                        <div class="primary-actions"></div>
                        <div class="title-bar clear"  tabindex="0" draggable="true" ondragstart="event.dataTransfer.setData('text/plain',null)" > 

        
                        
                            <div class="title" data-value=${JSON.stringify([dataset['id'], dataset['type']])} > 
                                <span class="hid">${dataset['hid']}: </span> <span class="name">${dataset['name']}</span>
                            </div>

                            <div id="add_data_share_menu" style="display: none;"  class="add_data_share_menu" >
                                <div class="send-data-genepattern-tools">
                                    <div class="gt" >  Send data to Galaxy  <i class="fa fa-refresh" aria-hidden="true"></i></div>

                                    <div class="galaxy-tool-list" style="display: none"> 
                                    </div>
                                    
                                    <div class="gpt" >  Send data to GenePattern  <i class="fa fa-refresh" aria-hidden="true"></i></div>
                                    <div class="genepattern-tool-list" style="display: none"> 
                                    </div>
                                </div>
                            </div>

                            <br>
                            <div title="0 nametags" class="nametags"></div>
                        </div>
                 </div>`
            
        var Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector(`.list-item.${dataset['history_content_type']}.history-content.state-${dataset['state']}`)

        if (dataset['state'] == 'error'){
            if (Tbl.querySelector('.primary-actions')){
               Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
               
               var spn = document.createElement('li')
               spn.className =  "fa fa-times-circle"
               spn.style.color = 'red'
               Tbl.querySelector('.title-bar.clear').prepend(spn)
            
            }

        } else if (dataset['state'] == 'ok') {
            if (Tbl.querySelector('.primary-actions')){
                Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a>`
            }
        } 
        else if (dataset['state'] == 'paused') {
             Tbl.style.background = '#daecf8'
            // Tbl.className = `list-item ${dataset['history_content_type']} history-content state-paused`
           
            if (Tbl.querySelector('.primary-actions')){
                Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
            }
        }

        parent.append(Tbl)

        var states = ['new', 'queued', 'running', 'paused']
        var sub_states = ['new', 'queued']

        if (states.includes(dataset['state']) ){
            if (sub_states.includes(dataset["state"])){
                var spn = document.createElement('li')
                spn.className = "fa fa-clock-o"
                spn.style.color = 'black'
                Tbl.querySelector('.title-bar.clear').prepend(spn)
            } 
            else if (dataset['state'] == 'paused') {
                var spn = document.createElement('li')
                spn.className =  "fa fa-pause"
                spn.style.color = 'black'
                Tbl.querySelector('.title-bar.clear').prepend(spn)
            }

            else if (dataset['state'] == 'running') {
                var spn = document.createElement('li')
                spn.className =  "fas fa-spinner fa-spin"
                spn.style.color = 'black'
                Tbl.querySelector('.title-bar.clear').prepend(spn)
            }

            for (let i = 0; i < Infinity; ++i) {

                var data = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(dataset['id'])} )`)

                if ( data['state'] == 'new'  ){
                    Tbl.className = `list-item ${dataset['history_content_type']} history-content state-new`
                    Tbl.style.background = '#7d959d70'
                }   

                else if ( data['state'] == 'queued' ){
                    Tbl.className = `list-item ${dataset['history_content_type']} history-content state-queued`
                    Tbl.style.background = '#7d959d70'
                } 

                else if(data['state'] == 'running'){
                    if(Tbl.querySelector('.fa.fa-clock-o')){
                        Tbl.querySelector('.fa.fa-clock-o').className =  "fas fa-spinner fa-spin"
                    }
                    
                    Tbl.style.background = '#ffe6cd'
                    Tbl.className = `list-item ${dataset['history_content_type']} history-content state-running`
                }

                await this.waitforme(2000);

                if ( data['state'] == 'ok' ) {
                    Tbl.style.background = '#C2EBC2'
                    Tbl.className = `list-item ${dataset['history_content_type']} history-content state-ok`

                    Tbl.querySelector('.fas.fa-spinner.fa-spin').parentElement.removeChild(Tbl.querySelector('.fas.fa-spinner.fa-spin'))
                    
                    if (Tbl.querySelector('.primary-actions')){
                        Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a>`
                    }
                    break;
                }  
                
                else if (data['state'] == 'error'){
                    Tbl.style.background = '#f4a3a5'
                    Tbl.className = `list-item ${dataset['history_content_type']} history-content state-error`

                    if(Tbl.querySelector('.fas.fa-spinner.fa-spin')){
                        Tbl.querySelector('.fas.fa-spinner.fa-spin').className =  "fa fa-times-circle"
                        Tbl.querySelector('.fa.fa-times-circle').style.color = 'red'
                    } else if (Tbl.querySelector('.fa.fa-clock-o')){
                        Tbl.querySelector('.fa.fa-clock-o').className =  "fa fa-times-circle"
                        Tbl.querySelector('.fa.fa-times-circle').style.color = 'red'
                    }
                   
                    if (Tbl.querySelector('.primary-actions')){
                        Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
                    }

                    
                    break;
                }     

                // else if (data['state'] = 'paused') {
                //     Tbl.style.background = '#daecf8'
                //     Tbl.className = `list-item ${dataset['history_content_type']} history-content state-paused`
                   
                //     if (Tbl.querySelector('.primary-actions')){
                //         Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
                //     }

                //     // var spn = document.createElement('li')
                //     // spn.className = "fa fa-pause"
                //     // spn.style.color = 'black'
                //     // Tbl.querySelector('.title-bar.clear').prepend(spn)
                //     break;
                // }
            }
        }

        var exch  = Tbl.querySelector('.fa.fa-exchange')
        var title = Tbl.querySelector('.title')
        var gp_tools = Tbl.querySelector('.gpt')
        var g_tools = Tbl.querySelector('.gt')

        title.data = dataset

        if (g_tools) {
            g_tools.addEventListener("click", (e) => {

                // var server =  Tbl.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
                // var server =  Tbl.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
                var server =  Tbl.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
                var gp_tools_div = Tbl.querySelector('.galaxy-tool-list')
    
                this.galaxy_data_upload(gp_tools_div, dataset, server)
    
                if (Tbl.querySelector('.galaxy-tool-list').style.display == 'block') {
                    Tbl.querySelector('.galaxy-tool-list').style.display = 'none'
                } 
                else{
                    Tbl.querySelector('.galaxy-tool-list').style.display = 'block'
                }
            })
        }

        if (gp_tools){
            gp_tools.addEventListener("click", (e) => {

                var gp_tools_div = Tbl.querySelector('.genepattern-tool-list')
    
                this.data_upload(gp_tools_div, dataset)
    
                if (gp_tools_div.childNodes.length == 0){
                    var div = document.createElement('div')
                    var msg = document.createElement('p')
                    div.append(msg)
                    msg.innerText = '  No tools are available..'
                    gp_tools_div.append(div)
                } 
    
                if (Tbl.querySelector('.genepattern-tool-list').style.display == 'block') {
                    Tbl.querySelector('.genepattern-tool-list').style.display = 'none'
                } 
                else{
                    Tbl.querySelector('.genepattern-tool-list').style.display = 'block'
                }
            })
        }

        if (exch) {
            exch.addEventListener("click", async (event) => { 
                var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(dataset['id'])} )`)
    
                if (Tbl.querySelector('#add_data_share_menu').style.display == 'block') {
                    Tbl.querySelector('#add_data_share_menu').style.display = 'none'
                } 
                else{
                    Tbl.querySelector('#add_data_share_menu').style.display = 'block'
                }
            })
        }

        title.addEventListener('click', async (e) => {

            if (Tbl.querySelector('.details') == null ){
                var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(dataset['id'])} )`) 
                var ok_details = await this.dataset_ok_details(show_dataset)
                Tbl.append(ok_details)
            }

            if (Tbl.querySelector('.details').style.display == 'block') {
                Tbl.querySelector('.details').style.display = 'none'
            } else{
                Tbl.querySelector('.details').style.display = 'block'
            }
        });

        var title = Tbl.querySelector('.title-bar.clear')

        var dragged

        title.addEventListener("dragstart", (event) => {
            this.dragged = event.target;
        }, false);

        var download_button = Tbl.querySelector('.fa.fa-download')

        if (download_button) {
            download_button.addEventListener('click', async (event) => {
                KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(collection_id=${JSON.stringify(dataset['id'])}, server=${JSON.stringify(this.model.get('gal_instance')['url'])} )`);
            })
        }

        this.delete_dataset(Tbl, dataset['id'],  history_id)

        return Tbl
    } 
    
    async dataset_row_ok_state (dataset, history_id){

        var URL = this.model.get('gal_instance')['url']

        var row = `<div id="${dataset['type_id']}"   class="list-item ${dataset['history_content_type']} history-content state-ok" >
                    <div class="warnings"></div>
                    <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                    <div class="primary-actions"><a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/display/?preview=True" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/edit?dataset_id=${dataset['id']}" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a></div>
                    <div class="title-bar clear"  tabindex="0" draggable="true" ondragstart="event.dataTransfer.setData('text/plain',null) > 
                    <span class="state-icon"></span>
   
                        <div class="title" data-value=${JSON.stringify([dataset['id'], dataset['type']])} > 
                            <span class="hid">${dataset['hid']}: </span> <span class="name">${dataset['name']}</span>
                        </div>

                        <div id="add_data_share_menu" style="display: none;"  class="add_data_share_menu" >
                            <div class="send-data-genepattern-tools">
                                <div class="gt" >  Send data to Galaxy  <i class="fa fa-refresh" aria-hidden="true"></i></div>

                                <div class="galaxy-tool-list" style="display: none"> 
                                </div>
                                 
                                <div class="gpt" >  Send data to GenePattern  <i class="fa fa-refresh" aria-hidden="true"></i></div>
                                <div class="genepattern-tool-list" style="display: none"> 
                                </div>
                            </div>
                        </div>

                        <br>
                        <div title="0 nametags" class="nametags"></div>
                      </div>
                    </div>`
            
        const Tbl = new DOMParser().parseFromString(row, 'text/html').querySelector(`.list-item.${dataset['history_content_type']}.history-content.state-ok`)
        var exch  = Tbl.querySelector('.fa.fa-exchange')
        var title = Tbl.querySelector('.title')
        var gp_tools = Tbl.querySelector('.gpt')
        var g_tools = Tbl.querySelector('.gt')

        title.data = dataset

        g_tools.addEventListener("click", (e) => {

            // var server =  Tbl.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
            // var server =  Tbl.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
            var server =  Tbl.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
            var gp_tools_div = Tbl.querySelector('.galaxy-tool-list')

            this.galaxy_data_upload(gp_tools_div, dataset, server)

            if (Tbl.querySelector('.galaxy-tool-list').style.display == 'block') {
                Tbl.querySelector('.galaxy-tool-list').style.display = 'none'
            } 
            else{
                Tbl.querySelector('.galaxy-tool-list').style.display = 'block'
            }
        })

        gp_tools.addEventListener("click", (e) => {

            var gp_tools_div = Tbl.querySelector('.genepattern-tool-list')

            this.data_upload(gp_tools_div, dataset)

            if (gp_tools_div.childNodes.length == 0){
                var div = document.createElement('div')
                var msg = document.createElement('p')
                div.append(msg)
                msg.innerText = '  No tools are available..'
                gp_tools_div.append(div)
            } 

            if (Tbl.querySelector('.genepattern-tool-list').style.display == 'block') {
                Tbl.querySelector('.genepattern-tool-list').style.display = 'none'
            } 
            else{
                Tbl.querySelector('.genepattern-tool-list').style.display = 'block'
            }
        })

        exch.addEventListener("click", async (event) =>{ 
            var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(dataset['id'])} )`)

            if (Tbl.querySelector('#add_data_share_menu').style.display == 'block') {
                Tbl.querySelector('#add_data_share_menu').style.display = 'none'
            } 
            else{
                Tbl.querySelector('#add_data_share_menu').style.display = 'block'
            }
        })

        title.addEventListener('click', async (e) => {

            if (Tbl.querySelector('.details') == null ){
                var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(dataset['id'])} )`) 
                var ok_details = await this.dataset_ok_details(show_dataset)
                Tbl.append(ok_details)
            }

            if (Tbl.querySelector('.details').style.display == 'block') {
                Tbl.querySelector('.details').style.display = 'none'
            } else{
                Tbl.querySelector('.details').style.display = 'block'
            }
        });

        var title = Tbl.querySelector('.title-bar.clear')

        var dragged

        title.addEventListener("dragstart", (event) => {
            this.dragged = event.target;
        }, false);

        var download_button = Tbl.querySelector('.fa.fa-download')

        download_button.addEventListener('click', async (event) => {
            KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(collection_id=${JSON.stringify(dataset['id'])}, server=${JSON.stringify(this.model.get('gal_instance')['url'])} )`);
        })

        this.delete_dataset(Tbl, dataset['id'],  history_id)

        return Tbl
    } 
    
    async dataset_error_details (dataset){

        var URL = this.model.get('gal_instance')['url']

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

    async dataset_ok_details (dataset){

        var URL = this.model.get('gal_instance')['url']

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
                                    <a class="download-btn icon-btn"  href="${URL}/datasets/${dataset['id']}/display?to_ext=${dataset['extension']}" title="" data-original-title="Download"> <span class="fa fa-save" title="Download data"></span> </a><a class="icon-btn" title=""  href="javascript:void(0);" data-original-title="Copy link"><span class="fa fa-chain" style="" title="Copy link"></span></a><a class="icon-btn params-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style="" title="Dataset details"></span></a><a class="icon-btn visualization-link" title="" target="_blank" href="${URL}/visualizations?dataset_id=${dataset['dataset_id']}" data-original-title="Visualize this data"><span class="fa fa-bar-chart" style="" title="Visualize"></span></a>
                                </div>
                            </div>

                            <div class="annotation-display"></div>

                            <div class="display-applications"></div>
                            
                            <pre class="dataset-peek">${dataset['peek']}</pre> 
                        </div>
                       `

        const ok_details_html = new DOMParser().parseFromString(details, 'text/html').querySelector('.details')

        var display_apps = ok_details_html.querySelector('.display-applications')

        this.add_display_application(display_apps, dataset)
        this.copy_download_link(ok_details_html)

        return ok_details_html
    }
    
    async attach_event (node, className){ 

        var datasets = node.querySelectorAll(className)

        datasets.forEach((button) => button.querySelector('.title').addEventListener('click', (e) => {
    
            if (button.querySelector('.details').style.display == 'block') {
                button.querySelector('.details').style.display = 'none'
            } else{
                button.querySelector('.details').style.display = 'block'
            }
        }));
    }

    delete_dataset (row, dataset_id,  history_id, datatype='dataset'){

        var delete_button = row.querySelector('.fa.fa-times')

        if (delete_button != null){
            delete_button.addEventListener('click',  (e) => {
                delete_button.parentNode.parentNode.parentNode.parentNode.removeChild(delete_button.parentNode.parentNode.parentNode)
                if (datatype == 'dataset') {
                 KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.delete_dataset(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, history_id=${JSON.stringify(history_id)}, dataset_id=${JSON.stringify(dataset_id)})`)
                } 
                else if (datatype == 'collection') {
                    KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.delete_dataset_collection(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, history_id=${JSON.stringify(history_id)}, dataset_collection_id=${JSON.stringify(dataset_id)})`)
                }    
            });
        }
    }

    copy_download_link (ok_details_html){

        var chain_button = ok_details_html.querySelector('.fa.fa-chain')

        chain_button.addEventListener('click', (e) => {
            console.log(ok_details_html.querySelector('.download-btn.icon-btn')['href'])
        });
    }

    async JobStatusTemplate (parent, job){

        var self = this

        var job_status = `<div class="job-status-widget">
                            <div class="job-header">
                                <div class="indicator">
                                    <div class="gear-rotate-icon">
                                        <i class="fas fa-cog fa-spin" ></i>
                                    </div>
                                    <div class="job-done-icon">
                                        <i class="fa fa-check-circle"> </i>
                                    </div>
                                    <div class="job-error-icon">
                                        <i class="fa fa-times-circle" style="font-size: 25px; margin-top: 5px; border-radius: 22px"></i>
                                    </div>
                                </div>
                                <div class="job-done-text" style="width:30%;">
                                    <div class="job-state-text">
                                        Job queued                                        
                                    </div>
                                </div> 
                                
                                <div class="job-status" style="width:50%">
                                    <div class="job-id">
                                       
                                    </div>
                                </div>

                                <div class="job-status-buttons" style="margin-top:2px; float:right;" >
                                    <a class="icon-btn display-btn" title=""  data-original-title="View data"><span class="fas fa-eye" style="" title="View job details" ></span></a><a class="icon-btn display-btn" title=""  data-original-title="View data"><span class="fa fa-refresh" style="" title="Reset tool form" ></span></a>
                                </div>
                            </div>

                            <div class="job-output-files" style="display: none">
 
                            </div>

                            <div class="job-status-footer" style="width:100%; height: 30px;" >
                                <p class="footer-txt" style="color; white" >
                                </p>
                            </div>

                         </div>`

        const template = new DOMParser().parseFromString(job_status, 'text/html').querySelector('.job-status-widget')

        template.style.margin = '20px'

        if(job['state'] != 'job failed') {
            template.querySelector('.footer-txt').innerHTML = `Job: <b> ${job['id']}</b> submitted by: <b> ${this.model.get('gal_instance')['email_ID']}</b> on <b>${job['create_time'].split('T')[0]}</b> at <b>${job['create_time'].split('T')[1].split('.')[0]} </b>`
            template.querySelector('.job-id').innerHTML = `Job ID: <b> ${job['id']}</b>`
        }


        var tool_form = this.el.querySelector('.tool-forms')
        var BTN = template.querySelector('.fa.fa-refresh')

        BTN.addEventListener('click', async (e) => {

            tool_form.style.backgroundColor = 'rgb(246,246,246)'

            self.el.querySelector('.Galaxy-form').style.display = 'block'
            self.el.querySelector('.galaxy-history-list').style.display = 'block'

            var nodes = self.el.querySelectorAll('.job-status-widget')

            for (var i = 0; i < nodes.length; i++) {
                nodes[i].parentElement.removeChild(nodes[i])
            }
            self.hide_run_buttons()
        } );
    
        var BTNI = template.querySelector('.fas.fa-eye')

        BTNI.addEventListener('click', (e) => {

            if (template.querySelector('.job-output-files').style.display == 'block') {
                template.querySelector('.job-output-files').style.display = 'none'
            } else{
                template.querySelector('.job-output-files').style.display = 'block'
            }
        })


        var Table = `<div id ="${job['id']}" class="donemessagelarge">
                        <p> Executed <b>${this.model.get('gal_instance')['tool_name']}</b> and successfully added 1 job to the queue. </p>
                        <p>The tool uses this input:</p>
                        <ul class="inputs">
                        </ul>
                        <p>It produces this output:</p>
                        <ul class=outputs>
                        </ul> 

                        <p> You can check the status of queued jobs and view the resulting data at the History panel.
                            When the job has been run the status will change from 'Job queued', 'running' to ' Job Complete' if completed successfully or
                        'fatal error' if problems were encountered. </p>
                    </div>`

        var JobPanel = new DOMParser().parseFromString(Table, 'text/html').querySelector('.donemessagelarge')

        var inputs = JobPanel.querySelector('.inputs')
        var outputs = JobPanel.querySelector('.outputs')

        var states = ['ok', 'error']


        if (job['state'] != "job failed"){
            var jb  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_job(gal_instance=${JSON.stringify(this.model.get('gal_instance'))}, job_id=${JSON.stringify(job["id"])})`)

            for (var j =0; j < Object.keys(jb['inputs']).length; j++){
                var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(jb['inputs'][Object.keys(jb['inputs'])[j]]['id'])} )`) 
                var ili  = document.createElement('li')
                var ib = document.createElement('b')
                ib.innerText = `${show_dataset['name']}`
                ili.append(ib)
                inputs.append(ili)
            }
    
            for (var k =0; k < Object.keys(jb['outputs']).length; k++){
                var oli  = document.createElement('li')
                var ob = document.createElement('b')
                var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(jb['outputs'][Object.keys(jb['outputs'])[k]]['id'])} )`) 
                ob.innerText =  `${show_dataset['name']}`
                oli.append(ob)
                outputs.append(oli)
            }
            template.querySelector('.job-output-files').append(JobPanel)   
            this.input_output_file_status_update(template, job)
        } else{
            self.el.querySelector('.Galaxy-form').style.display = 'none'
            self.el.querySelector('.galaxy-history-list').style.display = 'none'

            template.querySelector('.job-output-files').style.backgroundColor = 'pink'
            template.querySelector('.job-output-files').innerHTML = `<p> ${job['error']} </p>` 

            var job_done_text = template.querySelector(".job-state-text")
            job_done_text.innerText = 'Fatal Error'
            job_done_text.style.color = 'white'

            var gear_rotate = template.querySelector('.gear-rotate-icon')
            gear_rotate.style.display = 'none'

            var gear_rotate = template.querySelector('.job-error-icon')
            gear_rotate.style.display = 'block'

            template.querySelector('.footer-txt').innerHTML = `<b> Job failed at submission</b> for more details view job details`
        }

        parent.append(template)
    }

    async input_output_file_name (parent, job){

        var Table = `<div id ="${job['id']}" class="donemessagelarge">
                        <p> Executed <b>${this.model.get('gal_instance')['tool_name']}</b> and successfully added 1 job to the queue. </p>
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

        var states = ['ok', 'error']

        var jb  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_job(gal_instance=${JSON.stringify(this.model.get('gal_instance'))}, job_id=${JSON.stringify(job["id"])})`)

        for (var j =0; j < Object.keys(jb['inputs']).length; j++){
            var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(jb['inputs'][Object.keys(jb['inputs'])[j]]['id'])} )`) 
            var ili  = document.createElement('li')
            var ib = document.createElement('b')
            ib.innerText = `${show_dataset['name']}`
            ili.append(ib)
            inputs.append(ili)
        }

        for (var k =0; k < Object.keys(jb['outputs']).length; k++){
            var oli  = document.createElement('li')
            var ob = document.createElement('b')
            var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(this.model.get('gal_instance')['url'])}, dataset_id=${JSON.stringify(jb['outputs'][Object.keys(jb['outputs'])[k]]['id'])} )`) 
            ob.innerText =  `${show_dataset['name']}`
            oli.append(ob)
            outputs.append(oli)
        }

        parent.append(JobPanel)
    }


    async input_output_file_status_update(parent, job){

        var states = ['ok', 'error']

        for (let i = 0; i < Infinity; ++i) {

            var job  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_job(gal_instance=${JSON.stringify(this.model.get('gal_instance'))}, job_id=${JSON.stringify(job['id'])})`)
            var job_state = job['state']

            if (job_state=='running'){

                var gear_rotate = parent.querySelector('.gear-rotate-icon')
                gear_rotate.style.display = 'block'

                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = 'Job Running'
                job_done_text.style.color = '#F5A207'

                var StdError  = parent.querySelector('.donemessagelarge')
                StdError.style.background = '#ffe6cd'
            } 

            else if (['queued', 'new'].includes(job_state)) {
                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = 'Job queued'

                var StdError  = parent.querySelector('.donemessagelarge')
                StdError.style.background = '#7d959d70'
            } 

            else if (job_state == 'ok'){
                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = 'Job complete'

                var gear_rotate = parent.querySelector('.gear-rotate-icon')
                gear_rotate.style.display = 'none'

                var gear_rotate = parent.querySelector('.job-done-icon')
                gear_rotate.style.display = 'block'

                var StdError  =  parent.querySelector('.donemessagelarge')
                StdError.style.background = '#c2ebc2' 

                parent.querySelector('.job-id').style.color = "rgb(81,219,81)"
            } 

            else if (job_state == 'error'){

                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = 'Fatal Error'
                job_done_text.style.color = 'white'

                var gear_rotate = parent.querySelector('.gear-rotate-icon')
                gear_rotate.style.display = 'none'

                var gear_rotate = parent.querySelector('.job-error-icon')
                gear_rotate.style.display = 'block'

                var StdError  = parent.querySelector('.donemessagelarge')
                StdError.style.background = '#f4a3a5'

                parent.querySelector('.job-id').style.color = "red"

            }

            await this.waitforme(3000);

            if (states.includes(job_state) === true ) {
                break;
            }      
        }
    }

    async dataset_collection_list_item (show_dataset){

        var self = this
        var URL = this.model.get('gal_instance')['url']

        var list_item = `<div id="dataset-${show_dataset['id']}" class="list-item dataset state-${show_dataset['populated_state']}" >

                            <div class="warnings">
                            </div>

                            <div class="selector">
                                <span class="fa fa-2x fa-square-o"></span>
                            </div>

                            <div class="title-bar clear" tabindex="" draggable="true">
                                <span class="state-icon"></span>

                                <div class="title"><span class="name"></span></div>
                                </div>

                                <div class="details" style="display: none;">
                                    <h1> jai </h1>
                                </div>
                            </div>
                        </div>`
      
        const row = new DOMParser().parseFromString(list_item, 'text/html').querySelector('.list-item.dataset.state-ok')

        var line = `<div id="dataset-${dataset['dataset_id']}" class="list-item dataset history-content state-running" style="display: none;">
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

        row.querySelector('.name').addEventListener('click', async (e) => {

            if (row.querySelector('.details').style.display == 'block') {
                row.querySelector('.details').style.display = 'none'
            } else{
                row.querySelector('.details').style.display = 'block'
            }
        });

        var exch  = row.querySelector('.fa.fa-exchange')
        var title = row.querySelector('.title')
        var gp_tools = row.querySelector('.gpt')
        var g_tools = row.querySelector('.gt')

        title.data = elements

        g_tools.addEventListener("click", (e) => {

            var server =  row.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.Galaxy-form').data
            var gp_tools_div = row.querySelector('.galaxy-tool-list')

            elements['object']['extension'] = elements['object']['file_ext']
            elements['object']['name'] = elements['element_identifier']
            
            this.galaxy_data_upload(gp_tools_div, elements['object'], server)

            if (row.querySelector('.galaxy-tool-list').style.display == 'block') {
                row.querySelector('.galaxy-tool-list').style.display = 'none'
            } 
            else{
                row.querySelector('.galaxy-tool-list').style.display = 'block'
            }
        })

        gp_tools.addEventListener("click", (e) => {

            var gp_tools_div = row.querySelector('.genepattern-tool-list')
            this.data_upload(gp_tools_div, elements)

            if (gp_tools_div.childNodes.length == 0){
                var div = document.createElement('div')
                var msg = document.createElement('p')
                div.append(msg)
                msg.innerText = '  No tools are available..'
                gp_tools_div.append(div)
            } 

            if (row.querySelector('.genepattern-tool-list').style.display == 'block') {
                row.querySelector('.genepattern-tool-list').style.display = 'none'
            } 
            else{
                row.querySelector('.genepattern-tool-list').style.display = 'block'
            }
        })

        exch.addEventListener("click", async (event) =>{ 

            if (row.querySelector('#add_data_share_menu').style.display == 'block') {
                row.querySelector('#add_data_share_menu').style.display = 'none'
            } 
            else{
                row.querySelector('#add_data_share_menu').style.display = 'block'
            }
        })

        var download = row.querySelector('.fa.fa-download')

        download.addEventListener('click', () => {
            KernelSideDataObjects(`from GiN import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server( server=${JSON.stringify(self.model.get('gal_instance')['url'])}, collection_id=${JSON.stringify(elements['object']['id'])}) `);
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
        var history_id = self.element.querySelector('#history_ids').value 
        var form = self.element.querySelector('.Galaxy-form')
        var inputs = this.get_form_data(form, 'on')

        if (inputs == 'error'){
            return
        }

        var toolid =  self.model.get('gal_instance')['url']+"/"+"GiN_data_upload_tool"
   
        if (this.model.get('inputs')['id'] == toolid) {
            this.dataupload_job()
        } else {

           this.SubmitJob(inputs, history_id)
        }
        }));
    }

    async SubmitJob(inputs, history_id){

        var toolforms = this.el.querySelector('.tool-forms') 
        var hl = this.el.querySelector('#dataset-history-list')

        for (var i = 0; i <  hl.options.length; i++ ){
            if (hl[i].value == history_id) {
                hl.selectedIndex = i
            }
        }

        var jobs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.submit_job(gal_instance=${JSON.stringify(this.model.get('gal_instance'))}, tool_inputs=json.loads('${JSON.stringify(inputs)}'), history_id=${JSON.stringify(history_id)})`)
       

       if (jobs['state'] == 'job failed'){

        this.JobStatusTemplate(toolforms, jobs)

       } else{
            for (var i = 0; i < jobs['jobs'].length; i++ ) {
                this.JobStatusTemplate(toolforms, jobs['jobs'][i])
            }
            
            var data_list_div = this.el.querySelector('.history-dataset-list');
            var e = this.el.querySelector('.list-item')
            e.parentElement.removeChild(e)

            data_list_div.append(await this.data_row_list(this.model.get('gal_instance')['url'], history_id))
        
            this.el.querySelector('.Galaxy-form').style.display = 'none'
            this.el.querySelector('.galaxy-history-list').style.display = 'none'
       }

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

    add_display_application (display_apps, data) {

        var url = this.model.get('gal_instance')['url']
        var apps1 = data['display_apps']
        var apps2 = data['display_types']

        var data = []

        for (var i = 0; i < data.length; i++){

            var display_app = document.createElement('div')
            display_app.className = 'display-application'

            var dis_apps_span = document.createElement('span')
            dis_apps_span.className = 'display-application-location'
            dis_apps_span.innerText = data[i]['label']

            var dis_apps_span_link = document.createElement('span')
            dis_apps_span_link.className = 'display-application-links'

            display_app.append(dis_apps_span)
            display_app.append(dis_apps_span_link)
            display_apps.append(display_app)

            for (var j = 0; j < data[i]['links'].length; j++) {
                var link = document.createElement('a')
                link.target = data[i]['links'][j]['target']
                link.href = url+data[i]['links'][j]['href']
                link.innerText = data[i]['links'][j]['text']

                dis_apps_span_link.append(link)
            }
        }
        return display_apps
    }   
}