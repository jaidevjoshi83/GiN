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
import {  is_url, KernelSideDataObjects, show, removeAllChildNodes } from './utils';
import * as tus from "tus-js-client";
import axios from "axios";
import { Data } from '@g2nb/nbtools/lib/dataregistry';
import { ContextManager } from '@g2nb/nbtools';
import { NotebookActions } from '@jupyterlab/notebook';
import { Private,  getRanNotebookIds, getIndex } from './notebookActions';
import $ from 'jquery'
import {FileStreamer } from './utils'
import { UploadModel, UploadView } from '@g2nb/ipyuploads';



export class GalaxyUIBuilderModel extends BaseWidgetModel{
    
    defaults() {
        return Object.assign(Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyUIBuilderModel.model_name, _model_module: GalaxyUIBuilderModel.model_module, _model_module_version: GalaxyUIBuilderModel.model_module_version, _view_name: GalaxyUIBuilderModel.view_name, _view_module: GalaxyUIBuilderModel.view_module, _view_module_version: GalaxyUIBuilderModel.view_module_version, name: 'Python Function', description: '', origin: '', _parameters: [], parameter_groups: [], function_import: '', register_tool: true, collapse: true, events: {}, buttons: {}, display_header: true, display_footer: true, busy: false, run_label: 'Execute',  output: undefined, inputs:{}, form_output:{}, UI:{}, galaxy_tool_id:'', history_data:[], history_ids:[] }));
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
        <div class="Galaxy-form-div" >
            <div class="data-preview">

            </div>

            <div class="tool-forms"> 
                <form class="Galaxy-form">
                </form>
            </div>

            <div class="dataset-list">
                <div id="datalist-update" style="width: 100%;" >

                    <div ><span class="ui-form-title-text"><b> Select History</b> </span> </div>
                    <div id="dataset-status-text"><span class="ui-form-title-text"><b style="display:none;"> Loading.. </b> </span> </div>

                    <div> 
                        <i class="fa fa-refresh" aria-hidden="true"  title="Refresh History" ></i>
                        <i class="fas fa-spinner fa-pulse" aria-hidden="true" style="display:none"></i>
                    </div>
                </div>
                <div id="history-list" >

                </div>
                <div  class="history-dataset-list">

                </div>
            </div> 

            <div class="help-section" >
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
    this.galaxy_file_cache = [];
    this.conditional_name = [];
    this.list = [];
    this.repeat_del = {'name':"", "index":""};
    this.toolregistry = {'tools':""};
    this.select_index = null;
    this.section = {};
 

    // this.section_collapse = {'expanded':false, 'name':''}
    // <iframe src="http://localhost:8080/datasets/fa70ae9fc8539e18/display/?preview=True&?api_key=865ad23561f93ec78ed5398e815c1057" title="W3Schools Free Online Web Tutorials"></iframe>
    }
  
    render() {

        super.render();
        const inputs = this.model.get('inputs')
        //########################
        //########################
        // this.form_builder(inputs['inputs'])
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
        // this.iterate_over_tool_cells()

        if (this.model.get('name') == 'login'){
            this.login_form()
            this._submit_keypress()
            this.register_button()
        }
        
        if (this.model.get('name') != 'login' && 'GiN_data_upload_tool') {

            this.generate_tool_form()
            this.add_tool_migration_button(this.model.get('origin'))
            this.add_dataset_table()
            // this.add_history_list()
            this.add_galaxy_cell_metadata()
        }

        if (this.model.get('galaxy_tool_id') == 'GiN_data_upload_tool') {
            this.data_upload_tool()
        }


    }

    refresh_cells(){

        if (!ContextManager.notebook_tracker) return;               
        if (!ContextManager.notebook_tracker.currentWidget) return; 
        const cells = ContextManager.notebook_tracker.currentWidget.content.widgets;

        for (var i = 0; i < cells.length; i++){
            if(cells[i].model.metadata.get('galaxy_cell') &&  cells[i].model.metadata.get('tool_type') != 'login'){
            }
        }
    }

    async add_tool_migration_button(index){


        var self = this

        var servers   = await KernelSideDataObjects(`import GiN\na = GiN.sessions.SessionList()\na.get_servers()`)
        KernelSideDataObjects(`try:\n    del a\nexcept:    print("a is not defined")`)
        
        // if (servers.length > 0) {

        var refresh_i = document.querySelector('i')
        refresh_i.className = "fa fa-refresh"
        refresh_i.title = "Refresh server list"
        refresh_i.id = "migration-tool-button"

        var d = document.createElement('div')
        d.id = 'migra-refresh-btn'
        d.append(refresh_i)

        var nbtools = this.el.querySelector('.nbtools-form')
        var Select = document.createElement('select')
        Select.className = 'tool-migration-select'

        var div = document.createElement('div')
        div.className = 'form-restore-div'

        var Label = document.createElement('div')
        Label.id = 'migra-label'
        Label.innerText = 'Select Server'

        div.append(d)
        div.append(Label)

        div.style.float = 'left'


        for (var i = 0; i < servers.length; i++){
            var opt = document.createElement('option')
            opt.value  = servers[i]
            if(servers[i] == index){
                opt.selected = true
            }
            opt.textContent  = servers[i]
            Select.appendChild(opt)
        }

        Select.addEventListener('change', (e) => {

            if (this.model.get('galaxy_tool_id') !=  'GiN_data_upload_tool'){

                Private.Index = Select.selectedIndex

                if (!ContextManager.notebook_tracker) return;               
                if (!ContextManager.notebook_tracker.currentWidget) return;
            
                var notebookTracker = ContextManager.notebook_tracker
            
                const notebook = notebookTracker.currentWidget.content
                const notebookSession = notebookTracker.currentWidget.context.sessionContext;
                const cells = notebook.widgets;
                
                const p = notebook.activeCell.model.value.text;
                const regex = /http[^\s']+/i;
                notebook.activeCell.model.value.text = p.replace(regex, Select.value)

                notebook.activeCell.model.metadata.delete('input_params')
    
                NotebookActions.run(notebook, notebookSession);

            } else{

                // this.el.querySelector('#history_ids').parentNode.removeChild(this.el.querySelector('#dataset-history-list'))
                // this.add_history_list()
                // this.el.querySelector('#dataset-update-label').parentNode.removeChild(this.el.querySelector('#dataset-update-label'))
                this.add_dataset_table()
            }
        })

        refresh_i.addEventListener('click', async () => {

            var servers   = await KernelSideDataObjects(`import GiN\na = GiN.sessions.SessionList()\na.get_servers()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:    print("a is not defined")`)

            self.removeAllChildNodes(Select)

            for (var i = 0; i < servers.length; i++){

                var opt = document.createElement('option')
                opt.value  = servers[i]
                if(servers[i] == index){
                    opt.selected = true
                }
                opt.textContent  = servers[i]
                Select.appendChild(opt)
            }
        })

        div.append(Select)
        nbtools.prepend(div)

        // }
    }

    workflow_explorer(){

        this.el.querySelector('.Galaxy-form-div').style.display = 'none'
        var nb_form = this.el.querySelector('.nbtools-form')

        var data_upload = `<div class="login-form"> 

                                <div class="auth-error" style="display: none; margin: 10px;"> 
                                    <p> <b>Authentication error</b> </p>
                                </div>

                                <div class="auth-successful" style="display: none; margin: 10px;">
                                    <p> <b>Login Successful </b></p>
                                </div>

                                <div class="auth-successful" style="display: block; margin: 10px;">
                                    <p> <b>Refresh all Galaxy Cells </b></p>
                                </div>

                                <div class="login-form-div" style="display:block">

                                    <div class="tab">
                                            <button type="button" id="resumable_upload_button" class="tablinks" >With Credential</button>
                                            <button type="button" class="tablinks">With API Key</button>
                                    </div>

                                    <!-- Tab content -->
                                    <div id="credential-login" class="login-form-div" style="display: block;">

                                        <div style="margin:10px">
                                            <div>
                                            <span class="ui-form-title-text"> <b>Select Galaxy Server</b> </span>
                                            </div>
                                            <input type="text" name="server" value="https://usegalaxy.org" list="cityname">
                                            <datalist id="cityname">
                                                <option value="https://usegalaxy.org"> Galaxy Main </option>
                                                <option value="https://localhost:8080"> Galaxy Local</option>
                                                <option value="https://usegalaxy.eu"> Galaxy Europe</option>
                                                <option value="10.66.95.3:8080"> Lab local for testing</option>
                                            </datalist>
                                        </div>

                                        <div style=" margin:10px">
                                        <span class="ui-form-title-text"> <b>Email ID/User Name</b> </span>
                                            <input class="InputData" name="email" style="display: block" >
                                        </div>

                                        <div style=" margin:10px">
                                        <span class="ui-form-title-text"> <b>Password</b> </span>
                                            <input class="InputData" type="password" name="password" style="display: block" >
                                        </div>
                                    </div>
                            
                                    <div id="api-login" class="login-form-div" style="display: none;">

                                        <div style="margin:10px">
                                            <div>
                                                <span class="ui-form-title-text"> <b>Select Galaxy Server</b> </span>
                                            </div>
                                            <input type="text" class="InputData" name="server" value="https://usegalaxy.org" list="server-name">
                                            <datalist id="server-name">
                                                <option value="https://usegalaxy.org"> Galaxy Main </option>
                                                <option value="https://0.0.0.0:8080"> Galaxy Local</option>
                                                <option value="https://usegalaxy.eu"> Galaxy Europe</option>
                                            </datalist>
                                        </div>

                                        <div style=" margin:10px">
                                            <span class="ui-form-title-text"> <b>API Key</b> </span>
                                            <input class="InputData" name="api" style="display: block" >
                                        </div>
                                    </div>
                                </div>
                            </div>`

        const utm = new DOMParser().parseFromString(data_upload, 'text/html').querySelector('.login-form')

        var List = utm.querySelectorAll('.tablinks')        

        // utm.querySelector('#upload').style.display  = 'block'

        List.forEach((button) => button.addEventListener('click', () => {

            if (button.innerText  == 'With Credential') {
                utm.querySelector('#credential-login').style.display  = 'block'
                utm.querySelector('#api-login').style.display  = 'none'
            } else if (button.innerText  == 'With API Key') {
                utm.querySelector('#credential-login').style.display  = 'none'
                utm.querySelector('#api-login').style.display  = 'block'
            }
        }));

        // nb_form.append(utm)
    }

    login_form(){

        // this.add_galaxy_cell_metadata()

        var div = document.createElement('div')
        div.className = 'form-restore-div'

        div.style.float = 'right'
        div.style.marginRight = '150px'

        div.innerHTML = `<input type="checkbox" id="form-restore" name="form-restore" value="true">
                         <label for="form-restore"><b>Restore the form cells</b></label>`

        this.el.querySelector('.nbtools-description').append(div)

        // this.update_metadata_FormState('login', [], '')

        this.el.querySelector('.Galaxy-form-div').style.display = 'none'

        var nb_form = this.el.querySelector('.nbtools-form')

        var data_upload = `<div class="login-form"> 
                                <div class="auth-error" style="display: none;"> 
                                    <p> <b>Authentication error</b> </p>
                                </div>

                                <div class="auth-successful" style="display: none;">
                                    <p> <b>Login Successful </b></p>
                                </div>

                                <div class="auth-waiting" style="display: none;">
                                   <h4> Tools are loading <i class="fa fa-spinner fa-spin" ></i> </h> 
                                    
                                </div>

                                <div id="refresh-galaxy-cells" style="display: none; ">
                                    <button id="refresh-button" type="button" class="tablinks""> Save parameter values </button>
                                </div>

                                <div class="login-form-div" style="display:block">

                                    <div class="tab">
                                        <button type="button" id="resumable_upload_button" class="tablinks" >With Credential</button>
                                        <button type="button" class="tablinks">With API Key</button>
                                    </div>

                                    <!-- Tab content -->
                                    <div id="credential-login" class="tabcontent" style="display: block;">

                                        <div class="combo-box"> 
                                            <div class="input-wrapper">
                                                <span class="ui-form-title-text"> <b> Select Galaxy Server</b> </span>
                                                <input type="text" class="InputData" name="server" value="https://usegalaxy.org" autocomplete="off">
                                            </div>
                                            <ul class="ul-login">
                                                <li class="server-list-el" data-value="https://usegalaxy.org" > <b> Main</b>  </li>
                                                <li class="server-list-el" data-value="https://usegalaxy.eu">  <b>Europe</b>   </li>
                                                <li class="server-list-el" data-value="https://localhost:8080" >  <b>Local Server</b> </li>
                                                <li class="server-list-el" data-value=" http://10.66.95.3:8080" >  <b>Lab's local for testing</b> </li>
                                                    
                                            </ul>
                                        </div>

                                        <div id="login-email" >
                                            <span class="ui-form-title-text"> <b>Email ID/User Name</b> </span>
                                            <input class="InputData" name="email" style="display: block" >
                                        </div>

                                        <div id="login-password" >
                                            <span class="ui-form-title-text"> <b>Password</b> </span>
                                            <input class="InputData" type="password" name="password" style="display: block" >
                                        </div>
                                    </div>
                                  
                                </div>
                            </div>`

        const utm = new DOMParser().parseFromString(data_upload, 'text/html').querySelector('.login-form')

        var List = utm.querySelectorAll('.tablinks')    
        var cb = utm.querySelector('.combo-box') 

        cb.querySelector('.input-wrapper').querySelector('input').addEventListener('click', ()=>{
            cb.querySelector('.ul-login').style.display = 'none'
        })

        this.login_server_list(cb)

        List.forEach((button) => button.addEventListener('click', () => {

            if (button.innerText  == 'With Credential') {
                utm.querySelector('#login-email').style.display  = 'block'
                utm.querySelector('#login-password').querySelector('span').innerHTML= "<b>Password</b>"
                utm.querySelector('#login-email').querySelector('input').style.display = 'block'
                utm.querySelector('#login-password').querySelector('input').value = ''
                utm.querySelector('#login-email').querySelector('input').value = ''
                utm.querySelector('#login-password').querySelector('input').style.background = ''
                utm.querySelector('#login-email').querySelector('input').style.background = ''
            } 
            
            else if (button.innerText  == 'With API Key') {
                utm.querySelector('#login-email').querySelector('input').style.display = 'none'
                utm.querySelector('#login-email').style.display  = 'none'
                utm.querySelector('#login-password').querySelector('span').innerHTML= "<b>API Key</b>"
                utm.querySelector('#login-email').querySelector('input').value = ''
                utm.querySelector('#login-password').querySelector('input').style.background = ''
            }
        }));

        var  refresh = utm.querySelector('#refresh-button')

        refresh.addEventListener('click', () => {
            this.runAllGalaxyCells()
        })

        this.el.querySelector('.form-restore-div').style.display  =  'none';
        nb_form.append(utm)
    }

    login_server_list(cb){

        var inp = cb.querySelector('.InputData')

        inp.addEventListener("mouseenter", ()=>{
            cb.querySelector('.ul-login').style.display = 'block'
        })
        
        inp.addEventListener("mouseleave", ()=>{
            cb.querySelector('.ul-login').style.display = 'none'        
        });
        
        cb.querySelectorAll('li').forEach(function(el) {
            el.addEventListener('click', ()=>{        
                cb.querySelector('.InputData').value = el.dataset.value
                cb.querySelector('.ul-login').style.display = 'none'
            })
          });
        
        var ul = cb.querySelector('.ul-login')
        
        ul.addEventListener("mouseenter", ()=>{
            cb.querySelector('.ul-login').style.display = 'block'
        });
        
        ul.addEventListener("mouseleave", ()=>{
            cb.querySelector('.ul-login').style.display = 'none'
        });
        
        // cb.querySelector('.InputData').addEventListener("click", ()=>{
        //     cb.querySelector('.ul-login').style.display = 'none'
        // });
    }

    iterate_over_tool_cells() {

        if (!ContextManager.notebook_tracker) return;               
        if (!ContextManager.notebook_tracker.currentWidget) return; 
        const cells = ContextManager.notebook_tracker.currentWidget.content.widgets;
        for(var i = 0; i < cells.length; i++) {
            if (cells[i]._input.node.querySelector('.lm-Widget.p-Widget.jp-InputPrompt.jp-InputArea-prompt').innerText == '[*]:'){
                return cells[i].model.metadata.get('input_params')
            }
        }
    }


    add_galaxy_cell_metadata(){

        if (!ContextManager.notebook_tracker) return;               
        if (!ContextManager.notebook_tracker.currentWidget) return; 
        const cells = ContextManager.notebook_tracker.currentWidget.content.widgets;
        for(var i = 0; i < cells.length; i++) {
            if (cells[i]._input.node.querySelector('.lm-Widget.p-Widget.jp-InputPrompt.jp-InputArea-prompt').innerText == '[*]:'){
                cells[i].model.metadata.set('galaxy_cell', true)
            }
        }
    }

    generate_tool_form(){
        var inp = this.iterate_over_tool_cells()

        if (inp != undefined){   
            if (inp.length == 0 ) {
                const inputs = this.model.get('inputs')
                this.form_builder(inputs['inputs'])
            } else{
                this.form_builder(inp)
            }
            
        } else{
            const inputs = this.model.get('inputs')
            this.form_builder(inputs['inputs'])

            var form_parent = this.el.querySelector('.Galaxy-form')
            form_parent.data = this.model.get('origin')
            let form = form_parent.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(form)
            if (this.model.get('galaxy_tool_id') != "GiN_data_upload_tool" ) {
                this.update_metadata_FormState('galaxy_tool', inputs['inputs'], JSON.parse(fint))
            }
        }
    }

    update_metadata_FormState(tool_type, inputs, html){

        ContextManager.tool_registry.current.content.activeCell.model.metadata.set('tool_type', tool_type)
        ContextManager.tool_registry.current.content.activeCell.model.metadata.set('input_params', inputs)
        ContextManager.tool_registry.current.content.activeCell.model.metadata.set('html', html)
    }

    un_wrap_repeat1(input, name){
    
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
 
    un_wrap_repeat(input, name){

        var self = this
        var out 

        for (var i = 0; i < input.length; i++ ){

            if (input[i]['type'] == 'conditional'){
                for(var j = 0; j < input[i].cases.length; j++){
                    if(self.un_wrap_repeat(input[i].cases[j].inputs, name) != undefined) {
                        out = self.un_wrap_repeat(input[i].cases[j].inputs, name)
                        return out
                    }
                }
            } else if (input[i]['type'] == 'repeat' && input[i].name != name) {

                if (self.un_wrap_repeat(input[i].inputs, name) != undefined){
                    out = self.un_wrap_repeat(input[i].inputs, name)
                    return out
                }
            } else if (input[i]['type'] == 'section'){

                if(self.un_wrap_repeat(input[i].inputs, name) != undefined) {
                    out = self.un_wrap_repeat(input[i].inputs, name)
                    return out
                }

            } else if (input[i]['type'] == 'repeat' && input[i].name == name){
                out =  input[i]
                return out
            }
        }

        if(out != undefined){
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

        form_parent.dataset.server = this.model.get('origin')
        form_parent.data = this.model.get('origin')
    
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
                this.add_conditional_section_1(input_def, form_parent, name_prefix, data);
                break;
            case "data":
            case "data_collection":
                this.add_input_data(input_def, form_parent, name_prefix, data)
                break
            case "integer" :
            case  "float" :
            case "text":
            case "color":
                this.add_input_value(input_def, form_parent, name_prefix)
                break
            case "boolean":
                this.add_boolean_field(input_def, form_parent, name_prefix)
                break
            case "select":

                this.add_select_field(input_def, form_parent, name_prefix)
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
        }
    }
     // remove() {
     //     super.remove();
     //     // Clean up data files from the cache
     //     for (let f of this.file_cache)
     //         ContextManager.data_registry.unregister({ data: f });
     // }
 
    async data_upload(gp_tool_list, dataset) {

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

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

                } else {

                        e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'block'

                        uri = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.send_data_to_gp_server(file_name=${JSON.stringify(dataset['name'])}, tool_id=${JSON.stringify(tool_id)}, dataset_id=${JSON.stringify(dataset['id'])}, server=${JSON.stringify(origin)}, ext=${JSON.stringify(dataset['extension'])})`)
                         
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

    add_tools(tool_list){

        var a = document.querySelector('.lm-Widget.p-Widget.nbtools-toolbox.nbtools-wrapper')
        
        // const list = origin.querySelector('ul');
        // const tool_wrapper = document.createElement('li');
        // tool_wrapper.classList.add('nbtools-tool');
        // tool_wrapper.setAttribute('title', 'Click to add to notebook');
        // tool_wrapper.innerHTML = `
        //     <div class="nbtools-add">+</div>
        //     <div class="nbtools-header">${tool.name}</div>
        //     <div class="nbtools-description">${tool.description}</div>`;
        // if (list) list.append(tool_wrapper);

        // // Add the click event
        // tool_wrapper.addEventListener("click", () => {
        //     Toolbox.add_tool_cell(tool);
        // })
    }

    add_origin(name) {
        // Create the HTML DOM element
        const origin_wrapper = document.createElement('div');
        origin_wrapper.innerHTML = `
            <header class="nbtools-origin" title="${name}">
                <span class="nbtools-expanded nbtools-collapse jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
                ${name}
            </header>
            <ul class="nbtools-origin" title="${name}"></ul>`;

        // Attach the expand / collapse functionality
        const collapse = origin_wrapper.querySelector('span.nbtools-collapse');
        collapse.addEventListener("click", () => this.toggle_collapse(origin_wrapper));

        // Add to the toolbox
        this.node.append(origin_wrapper);
        return origin_wrapper;
    }

    add_DataCollectionToolParameter(input_def, FormParent, NamePrefix){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

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
                var inputs = await self.get_form_data(children)
                var history_id = self.el.querySelector('.galaxy-history-list').querySelector('#dataset-history-list').value
                // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
                var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)
              
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

    isDivVisible(divElement) {
        return divElement.offsetWidth > 0 && divElement.offsetHeight > 0;
      }
 

    // async get_form_data(form, checking){

    //     var self = this
    //     var out = {}

    //     // var Check = checking
        
    //     for (var i = 0; i < form.children.length; i++){
    //         if ((form.children[i].className.includes('pl-2') &&  form.children[i].style.display == 'block' && form.children[i].children.length > 0) ||  form.children[i].className.includes('ui-portlet-section') || form.children[i].className.includes('ui-repeat')  || form.children[i].className.includes('sections')){

    //             if (await self.get_form_data(form.children[i], checking) == 'error') {
    //                 return 'error'
    //             } else{
    //                 Object.assign(out,  await self.get_form_data(form.children[i], checking))
    //             }
    //         } else if (form.children[i].className == 'ui-form-element section-row') {
        
    //             if (form.children[i].querySelector('.InputData')){

    //                 var opt
        
    //                 if (form.children[i].querySelector('.InputData')['data-value']){
    //                     opt = form.children[i].querySelector('.InputData')['data-value']
    //                 }
            
    //                 if (checking == 'on' && opt == false){

    //                     if (form.children[i].querySelector('.InputData').value == "") {
    //                         form.children[i].querySelector('.InputData').style.backgroundColor = 'pink'
    //                         return 'error'
    //                     } else {
                            
    //                         form.children[i].querySelector('.InputData').style.backgroundColor = ''
    //                         // out[form.children[i].querySelector('.InputData').name] =  form.children[i].querySelector('.InputData').value
    //                         if (form.children[i].querySelector('.InputData').parentNode.querySelector('#variable-checkbox') && form.children[i].querySelector('.InputData').parentNode.querySelector('#variable-checkbox').checked) {
    //                             // var variables =  await KernelSideDataObjects(`import IPython.display\ntry:\n    IPython.display.JSON({'value':globals()['${form.children[i].querySelector('.InputData').value}']})\nexcept:\n    pass`)
    //                             var variables =  await KernelSideDataObjects(`import IPython.display\nIPython.display.JSON({'value':globals()['${form.children[i].querySelector('.InputData').value}']})`)
    //                             out[form.children[i].querySelector('.InputData').name] =  variables
    //                         } else {
    //                             out[form.children[i].querySelector('.InputData').name] =  form.children[i].querySelector('.InputData').value
    //                         }
    //                     }
    //                 } else {

    //                     if (form.children[i].querySelector('.InputData').parentNode.querySelector('#variable-checkbox') && form.children[i].querySelector('.InputData').parentNode.querySelector('#variable-checkbox').checked) {                           
    //                         // var variables =  await KernelSideDataObjects(`import IPython.display\ntry:\n    IPython.display.JSON({'value':globals()['${form.children[i].querySelector('.InputData').value}']})\nexcept:\n    pass`)
    //                         var variables =  await KernelSideDataObjects(`import IPython.display\nIPython.display.JSON({'value':globals()['${form.children[i].querySelector('.InputData').value}']})`)
    //                         out[form.children[i].querySelector('.InputData').name] =  variables
    //                     } else {
    //                         out[form.children[i].querySelector('.InputData').name] =  form.children[i].querySelector('.InputData').value
    //                     }

    //                     // out[form.children[i].querySelector('.InputData').name] =  form.children[i].querySelector('.InputData').value
    //                 }
                
    //             } else if (form.children[i].querySelector('.outer-checkbox-div')){

    //                 var select_list = []
        
    //                 if (JSON.parse(form.children[i].querySelector('.outer-checkbox-div')['data-value'])["optional"] == true ) {
        
    //                     for (var k = 0; k < form.children[i].querySelector('.outer-checkbox-div').children.length; k++ ) {
    //                         if (form.children[i].querySelector('.outer-checkbox-div').children[k].querySelector('.InputDataCheckbox').checked) {
    //                             select_list.push(form.children[i].querySelector('.outer-checkbox-div').children[k].querySelector('.InputDataCheckbox').value)
    //                         }
    //                     }
        
    //                     if (select_list.length == 0){
    //                         out[form.children[i].querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').name] = null
    //                     }  else{
    //                         out[form.children[i].querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').name] = select_list
    //                     }
        
    //                 }  else if ((JSON.parse(form.children[i].querySelector('.outer-checkbox-div')['data-value'])["optional"] == false )){
    //                         if (select_list.length == 0){
    //                             form.children[i].querySelector('.outer-checkbox-div').children[0].querySelector('.InputDataCheckbox').parentNode.style.backgroundColor = 'pink'
        
    //                         } else if (select_list.length > 0 ){
    //                             form.children[i].querySelector('.outer-checkbox-div').children[0].querySelector('.InputDataCheckbox').parentNode.style.backgroundColor = ''
    //                             out[form.children[i].querySelector('.outer-checkbox-div').querySelector('.InputDataCheckbox').name] = select_list
    //                         }
    //                 }

    //             } else if (form.children[i].querySelector('.InputDataFile')){

    //                 if (checking == 'on') {
    //                     if (form.querySelector('.InputDataFile').options.length  == 0 ){
    //                         form.querySelector('.InputDataFile').style.backgroundColor = 'pink'
    //                         return 'error'
    //                     } else{
    //                         form.querySelector('.InputDataFile').style.backgroundColor = ''
        
    //                         var input_data = form.querySelector('.InputDataFile').parentElement['data-file']
    //                         var input_files = []
                
    //                         for (var i = 0; i < form.querySelector('.InputDataFile').options.length; i++) {
    //                             if (form.querySelector('.InputDataFile').options[i].selected == true) {
    //                                 input_files.push(JSON.parse(form.querySelector('.InputDataFile').options[i].value))
    //                             }
    //                         }
                            
    //                         out[form.querySelector('.InputDataFile').name] = input_data 
            
    //                         if (input_files.length == 1 && input_files[0]['id'] == ''){
    //                             out[form.querySelector('.InputDataFile').name] = null
    //                         } else{
    //                             input_data['values'] = input_files
    //                             out[form.querySelector('.InputDataFile').name] = input_data
    //                         }
    //                     }
        
    //                 } else{

    //                     var input_data = form.children[i].querySelector('.InputDataFile').parentElement['data-file']
    //                     var input_files = []
    
    //                     var opts = form.children[i].querySelector('.InputDataFile').options
    
    //                     for (var n = 0; n < opts.length ; n++){
    //                         if (opts[n].selected == true){
    //                             input_files.push(JSON.parse(opts[n].value))
    //                         }
    //                     }
                        
    //                     out[form.children[i].querySelector('.InputDataFile').name] = input_data 

    //                     if (input_files.length == 1 && input_files[0]['id'] == ''){
    //                         out[form.children[i].querySelector('.InputDataFile').name] = null
    //                     } else if (input_files.length == 0 ) {
    //                         out[form.children[i].querySelector('.InputDataFile').name] = {}
    //                     }
    //                     else{
    //                         input_data['values'] = input_files
    //                         out[form.children[i].querySelector('.InputDataFile').name] = input_data
    //                     }
    //                 }

    //             } else if(form.children[i].querySelector('.drill-down.container')) {

    //                 var drill_down_inputs = []
            
    //                     for(var n = 0; n < form.children[i].querySelector('.drill-down.container').querySelectorAll('input').length; n++) {
    //                         if (form.children[i].querySelector('.drill-down.container').querySelectorAll('input')[n].checked) {
    //                             drill_down_inputs.push(form.children[i].querySelector('.drill-down.container').querySelectorAll('input')[n].value)
    //                         }
    //                     }
    //                     out[form.children[i].querySelector('.drill-down.container').name] =  drill_down_inputs
            
    //             } else if (form.children[i].querySelector('.data_collection')){
                    
    //                     var input_files = []  
            
    //                     out[form.children[i].querySelector('.data_collection').name] = input_files  
            
    //                     for (var i = 0; i < form.children[i].querySelector('.data_collection').options.length; i++) {
    //                         if (form.children[i].querySelector('.data_collection').options[i].selected == true) {
    //                             input_files.push(form.children[i].querySelector('.data_collection').options[i].data)
    //                         }
    //                     }

    //                     if (checking == 'on') {
    //                         if (out[form.children[i].querySelector('.data_collection').name].length < 1 ){
    //                             fform.children[i].querySelector('.data_collection').style.backgroundColor = 'pink'
    //                             return 'error'
    //                         }
    //                         else {
    //                             form.children[i].querySelector('.data_collection').style.backgroundColor = ''
    //                             out[form.children[i].querySelector('.data_collection').name] = input_files
    //                             form.children[i].querySelector('.data_collection').parentElement['data-file']['values'] = input_files
    //                             out[form.children[i].querySelector('.data_collection').name] = form.children[i].querySelector('.data_collection').parentElement['data-file']
    //                         }
    //                     } else {
    //                         if (input_files.length == 0){
    //                             form.children[i].querySelector('.data_collection').parentElement['data-file']['values'] = [{}]
    //                         } else{
    //                             form.children[i].querySelector('.data_collection').parentElement['data-file']['values'] = input_files
    //                         }
    //                         out[form.children[i].querySelector('.data_collection').name] = form.children[i].querySelector('.data_collection').parentElement['data-file']
    //                     }
    //             }
    //         } else if (form.children[i].className == 'ui-form-element section-row conditional'){
    //             if (form.children[i].querySelector('.InputData')){
    //                 out[form.children[i].querySelector('.InputData').name] = form.children[i].querySelector('.InputData').value
    //             }
    //         }
    //     }

    //     // if (Object.keys(out).length > 0){
    //         return out  
    //     // }
    // }

    get_form_data(form, checking){
        var self = this
        var out = {}

        for(var i = 0 ; i < form.children.length;  i++){
            if($(form.children[i]).is(':visible')){

                if(self.get_form_data(form.children[i], checking) == 'error'){
                    return 'error'
                } else{

                    Object.assign(out, self.get_form_data(form.children[i], checking))
                    if(form.children[i].className == 'InputDataFile'){
                        var input_data = form.children[i].parentNode['data-file']
                        var data_files = []

                        for(var k = 0; k < form.children[i].children.length; k++ ){
                            if(form.children[i].children[k].selected){
                                data_files.push(JSON.parse(form.children[i].children[k].value))
                            }
                        }
                        input_data['values'] = data_files
                        out[form.children[i].name] = input_data

                        if (checking) {
                            if (data_files.length == 0){
                                form.children[i].style.backgroundColor = 'pink'
                                return 'error'
                            } else{
                                form.children[i].style.backgroundColor = ''
                            }
                        }
                    }

                    if(form.children[i].className == 'outer-checkbox-div'){

                        var div_data = JSON.parse(form.children[i]['data-value'])

                        var options = []

                        for (var j = 0; j < form.childNodes[i].children.length; j++){
                            var name 
                            if ($(form.childNodes[i].children[j]).find('.InputDataCheckbox')[0].checked) {
                                options.push($(form.childNodes[i].children[j]).find('.InputDataCheckbox')[0].value)
                            }
                        }

                        if (checking) {

                            if(!div_data['optional'] && options.length == 0){
                                form.children[i].style.backgroundColor = 'pink'
                                return 'error'
                            }
                            else if(!div_data['optional'] && options.length > 0){
                                form.children[i].style.backgroundColor = ''
                                out[div_data['name']] = options
                            } else if (div_data['optional'] && options.length == 0 ) {
                                out[div_data['name']] = div_data['value']
                            } else if(div_data['optional']&& options.length > 0) {
                                out[div_data['name']] = options
                            }
                        }
                    }

                    if(form.children[i].className == 'drill-down container'){            
                        var drill_down_inputs = []

                        for (var n = 0; n < $(form.children[i]).find('input').length; n++){
                            if ($(form.children[i]).find('input')[n].checked) {
                                drill_down_inputs.push($(form.children[i]).find('input')[n].value)
                            }
                        }

                        out[form.children[i].name] =  drill_down_inputs

                        if (checking) {
                            if ( drill_down_inputs.length == 0){
                                form.children[i].style.backgroundColor = 'pink'
                                return 'error' 
                            } else{
                                form.children[i].style.backgroundColor = ''
                            }
                        }
                    }

                    if(form.children[i].className == 'InputData'){

                        var div_data = JSON.parse(form.children[i].getAttribute('data-value'))

                        if(checking && form.children[i] == "" && div_data['optional']){
                            form.children[i].style.backgroundColor  = 'pink' 
                            return 'error'
                        } else{
                            out[form.children[i].name]  = form.children[i].value

                        }
                    }
                }
            }
        }

        return out
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

        for (var i = 0; i < input_list.length; i++) {
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
                                    var hi = form.parentNode.parentNode.querySelector('#dataset-history-list').value
                          
                                    var uri = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.send_data_to_galaxy_tool(server_d=${JSON.stringify(server)}, server_u=${JSON.stringify(e.target.data)}, dataset_id=${JSON.stringify(dataset['id'])}, ext=${JSON.stringify(dataset['extension'])}, dataset_name=${JSON.stringify(dataset['name'])}, history_id=${JSON.stringify(hi)})`)

                                    for (let i = 0; i < Infinity; ++i) {
                                      
                                        var out = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.show_data_set(server=${JSON.stringify(e.target.data)}, dataset_id=${JSON.stringify(uri['outputs'][0]['id'])} ))\na = Temp()\na.Return()`)
                                        KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

                                        await this.waitforme(5000);
                                        if (out['state'] === 'ok') {
                                            e.target.parentNode.parentNode.querySelector('.fas.fa-spinner.fa-spin').style.display = 'none'
                                            e.target.parentNode.parentNode.querySelector('.fas.fa-solid.fa-check').style.display = 'block'

                                            if (dataset['extension'] == null){
                                                dataset['extension'] = dataset['name'].split('.')[1]
                                            }

                                            self.galaxy_file_cache.push(new Data(e.target.data, [dataset['name'], out['name']], [dataset['id'], out['id']], dataset['extension']));

                                            const el = document.createElement("option");
        
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

    encode_chunk (blob) {
        return new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
    }

    async chunk_file (file) {
        const chunk_size = 1024 * 1024;
        const chunks_in_file = Math.ceil(file.size / chunk_size);
        const chunk_functions = [];
        const chunks = [];

        // Split the file into chunks
        let count = 0;
        while (count < chunks_in_file) {
            let offset = count * chunk_size;
            let file_blob = file.slice(offset, offset + chunk_size);
            chunks.push(file_blob);
            count++;
        }

        count = 0;
        for (const chunk of chunks) {
            const encoded_chunk = await this.encode_chunk(chunk);
            const chunk_function = async () => {
                this.send({
                    "event": "upload",
                    "file": file.name,
                    "count": count + 1,
                    "total": chunks_in_file,
                    "chunk": encoded_chunk,
                    "type":file.type
                });
                count++;
                this._chunks_complete++;
                this.update_upload_label(false, false)
                return {
                    chunk: this._chunks_complete,
                    total: this._chunks_total
                };
            }
            chunk_functions.push(chunk_function);
        }

        return chunk_functions;
    }

    update_upload_label(initial, final) {
        if (initial) {
            this._icon = this.model.get('icon');
            this._description = this.model.get('description');
            this.model.set('icon', '');
        }
        if (final) {
            this.model.set('icon', this._icon);
            this.model.set('description', this._description);
        }
        else {
            const percent = Math.floor(this._chunks_complete * (100 / this._chunks_total));
            this.model.set('description', `${percent}%`);
        }
        this.model.save();
    }


    //adopted from ipyuploads https://github.com/g2nb/ipyuploads
    async upload_files () {

        var elm = this.el.querySelector('#inputupload')
        // Set the widget as busy
        this.model.set('busy', true);
        this.model.save();

        // Estimate the number of chunks to upload
        this._chunks_total = 0;
        this._chunks_complete = 0;
        const files = Array.from( elm.files ?? []);
        files.forEach((file) => this._chunks_total += Math.ceil(file.size / (1024 * 1024)));

        // Set the uploading label
        // this.update_upload_label(true, false);

        // Cycle through all files
        const file_functions = [];
        files.forEach((file) => {
            const file_func = async () => {
                const chunk_funcs = await this.chunk_file(file);
                for (const cp of chunk_funcs) await cp();
                this.send({
                    "event": "file_complete",
                    "name": file.name,
                    "type": "test",
                });

                return {
                    
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    last_modified: file.lastModified,
                };
            }
            file_functions.push(file_func);
        });

        const files_data = [];
        for (const fp of file_functions) files_data.push(await fp());
        this.model.set('busy', false);
        this.model.set({
            value: files_data,
            error: '',
        });
        this.update_upload_label(false, true);
        this.send({
            "event": "all_files_complete",
            "names": files_data
        });
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

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var self = this
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

        Input.addEventListener('change', ()=>{

        })

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

        selectspan.addEventListener('click', async () => {

            for (var i = 0; i < Div2.querySelectorAll('.subgroup').length; i++ ) {
                Div2.querySelectorAll('.subgroup')[i].style.display = 'block'
            }

            for (var i = 0; i < Div2.querySelectorAll('input').length; i++) {
                Div2.querySelectorAll('input')[i].checked = 'true'
            }

            for (var i = 0; i < Div2.querySelectorAll('span').length; i++ ){
                Div2.querySelectorAll('span')[i].className = 'icon fa mr-1 fa-minus'
            }

            var history_id = self.el.querySelector('#dataset-history-list').value
            var form = self.el.querySelector('.Galaxy-form')

            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(formdata)

            var inputs = await self.get_form_data(form)
          //  var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
           
            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
        })

        Unselect.addEventListener('click', async () => {

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

            var history_id = self.el.querySelector('#history_ids').value
            var form = self.el.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(form)
            //var refine_inputs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
            
            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(formdata)
            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
        })

        FormParent.append(row)
        return row
    }


    add_variable_widget(tbl){

        tbl.querySelector('h3').innerText = "Error in variable name.."

        tbl.querySelector('#var-button').addEventListener('click', async (e)=>{
            e.preventDefault()
            var input = tbl.querySelector("#lname");
            var value = input.value;
            var refine = await KernelSideDataObjects(`import IPython.display\nIPython.display.JSON({'value':globals()['${value}']})`)
            
            if (refine['value'] == 'error'){
                tbl.querySelector('h3').innerText = "Error in variable name.."
            } else{
                tbl.querySelector('h3').innerText = "Enter a variable."
                tbl.parentNode.querySelector('.InputData').value = refine['value']
            }
        })
    }

    add_input_value (input_def, FormParent, NamePrefix){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var self = this
        input_def.id = this.uid()
        const input = document.createElement('input')
        input.type = input_def.type

        if (input.type == 'color'){
            input.style.height = '40px'
            input.style.padding= '1px'
        }

        input.id = `input-${input_def.id}`
        input.name = NamePrefix+input_def['name']
        input.value = input_def['default_value']
        input.className = 'InputData'
        const row = document.createElement('div')

        const title = document.createElement('div')
        title.className = 'ui-from-title'

        var row1 = `<table>
                        <tr>
                            <td id="float-menu" ><a class="icon-btn display-btn" target="" href="" data-original-title="View data"><span class="fa fa-exchange" style="" title="Get value from a variable"></span></a>
                                <input id="variable-checkbox" type="checkbox" >
                            </td>
                        </tr>
                    </table>`

        const Tbl = new DOMParser().parseFromString(row1, 'text/html').querySelector('table')

        title.append(Tbl)

        // this.add_variable_widget(title)

                // var row1 = `<table>
        //                 <tr>
        //                     <td id="float-menu" ><a class="icon-btn display-btn" target="" href="" data-original-title="View data"><span class="fa fa-exchange" style="" title="Get value from a variable"></span></a>
        //                     <input type="checkbox" >
        //                     <div class="div-to-display">
        //                         <div>
        //                             <div id="variable-title"> 
        //                                 <h3 style="margin-left:10px;">Enter a variable.</h3>
        //                             </div>
        //                             <div>
        //                                 <input type="text" id="lname" name="lname" >
        //                                 <button  id="var-button"> Get Variable</button>
        //                             </div>
        //                         </div>
        //                     <div>
        //                     </td>
        //                 </tr>
        //             </table>`

        // const Tbl = new DOMParser().parseFromString(row1, 'text/html').querySelector('table')

        // title.append(Tbl)

        // this.add_variable_widget(title)

        const TitleSpan = document.createElement('span')
        TitleSpan.className = "ui-form-title-text"
        TitleSpan.textContent = input_def.label
        TitleSpan.style.display = 'inline'

        input.setAttribute('data-value', JSON.stringify({"optional": input_def['optional'], "value":input_def['default_value']})) 

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

        input.addEventListener('input', async () =>{
            var history_id = self.el.querySelector('#dataset-history-list').value
            var form = self.el.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(form)
            //var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
          
            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(formdata)

            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
        })        

        row.append(title)
        row.append(input)
        row.append(help)

        FormParent.append(row)
        return row
    }
 
    async data_upload_tool() {

        if (this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var nb_form = this.el.querySelector('.Galaxy-form')

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
                                <div class="resumable-upload-warning" style="display: none;"> <b>Warning:</b> The upload will take longer than expected due to CORS error.</div>
                            </div>
                    
                            <div id="from_url" class="tabcontent" style="display: none;">
                                <p><b>Upload file from a URL to the Galaxy server.</b></p> 
                                <input class="input_upload" id="upload-url" >
                            </div>
                            
                            <div id="create_data" class="tabcontent" style="display: none;">
                                <p><b>Create a data file and upload to the Galaxy server.</b></p>
                                <div>
                                    <textarea class="input_upload" style="height: 30vh; width: 45vw;" >
                                        Example test for testing
                                    </textarea>
                                </div>
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
        var datatypes_genomes = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.get_data_type_and_genomes(server=${JSON.stringify(origin)})`)
       
        var Input = utm.querySelector('#inputupload')

        if (Input.files.length > 0){
            Input.addEventListener('change', ()=>{
                this.Upload_callback(Input)
            })
        }

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

        nb_form.append(utm)
    }

    async submitPayload(payload, credentials) {

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        // var apiKey = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.Return_api_key(${JSON.stringify(origin)})`)
        var apiKey =  await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.Return_api_key(${JSON.stringify(origin)}))\na = Temp()\na.Return()`)
        KernelSideDataObjects('try:\n    del a\nexcept:    print("a is not defined")')

        var self = this
        axios.post(`${origin}/api/tools/fetch`, payload, {

            headers: {
                //FixMe
                'x-api-key': apiKey['api_key'],
            }
        })
            .then((response) => {
                self.resumable(response['data']['outputs'][0])
            })
        
            .catch((error) => {
                console.log(error);
            });
    }
 
    async resumable (data){

        var HistoryID = self.el.querySelector('#dataset-history-list').value
        var state

        var e = this.el.querySelector('.list-item')
        e.parentElement.removeChild(e)

        DataListdiv.append(await this.data_row_list( HistoryID ))
        var ListItem =  this.el.querySelector('.list-item')

        data['type_id'] =`dataset-${data['id']}` 
        this.add_dataset(ListItem, this.data_row_list, HistoryID)
    }
 
    async NewTusUpload(data){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        this.el.querySelector('.upload-status-icon .fa-spin').style.display = 'block'

        // var apiKey = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.Return_api_key(${JSON.stringify(origin)})`)

        var apiKey =  await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.Return_api_key(${JSON.stringify(origin)}))\na = Temp()\na.Return()`)
        KernelSideDataObjects('try:\n    del a\nexcept:    print("a is not defined")')

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

        //FixMe
        // var credentials = this.model.get('gal_instance')
        data['key'] =  apiKey['api_key']

        var upload = new tus.Upload(file, {
            endpoint: `${origin}/api/upload/resumable_upload/`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            chunkSize: chunkSize,

            metadata: {
                filename: file.name,
                filetype: file.type,
            },
            headers: {
                'x-api-key': apiKey['api_key'],
            },
            
            onError: function(error) {

                var a = async () =>{
                    await self.upload_files()
                    await self.readFile()
                }

                a()

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

    // async NewTusUpload(data){

    //     await this.upload_files()
    //     await this.readFile()
    // }

    async readFile() {

        var origin = this.el.querySelector('.tool-migration-select').value
        this.el.querySelector('.resumable-upload-warning').style.display = 'block'
        this.el.querySelector('.resumable-upload-warning').style.color = 'orange'
        var elm = this.el.querySelector('#inputupload')
        var hi =  this.el.querySelector('#dataset-history-list').value

        const file = elm.files.item(0);

        var a = async () => {
            var out  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.start_upload( server=${JSON.stringify(origin)}, history_id=${JSON.stringify(hi)})`);
            while (out.status != 'finish'){
                setTimeout(5000)
                var out  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.check_upload(upload_id=${JSON.stringify(out.id)})`);
            }

            this.el.querySelector('.upload-status-icon .fa-spin').style.display = 'none'
            var DataListdiv = this.el.querySelector('.history-dataset-list');
    
            this.removeAllChildNodes(DataListdiv)    
            DataListdiv.append(await this.data_row_list(this.el.querySelector('#dataset-history-list').value))
            this.el.querySelector('#inputupload').value = ''

            return 
        }
        a()
    }

    async Upload_callback(input){
        
        var self  = this
        var children = this.element.querySelector('.Galaxy-form')

        this.el.querySelector('.resumable-upload-warning').style.display = 'none'
        this.el.querySelector('.upload-status-icon').style.display = 'block'
        
        var cnf = {};

        var data = {
            "history_id": self.element.querySelector('#dataset-history-list').value, 
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
    }
 
    async dataupload_job( uplood_status='', HistoryID='' ) {

        var origin = this.el.querySelector('.tool-migration-select').value

        // this.hide_run_buttons(true)

        var children = this.element.querySelector('.Galaxy-form')
        var upload_link 
        var upload_method

        var upload_method = children.querySelectorAll('.tabcontent')

        var datatype = children.querySelector('.datatypes_options').value
        var genome = children.querySelector('.genomes_options').value
        var history_id = this.el.querySelector('#dataset-history-list').value

        for (var i = 0; i < upload_method.length; i++ )  {
            if (upload_method[i].style.display ==  'block'){
                if (upload_method[i].querySelector('.input_upload').type == 'file') {
                  
                    this.Upload_callback(upload_method[i].querySelector('.input_upload'))

                } else{
                    upload_link = children.querySelectorAll('.tabcontent')[i].querySelector('.input_upload').value
                    upload_method = children.querySelectorAll('.tabcontent')[i].querySelector('.input_upload').type
                    children.querySelectorAll('.tabcontent')[i].querySelector('.input_upload').value = ''

                    var InitialData = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.upload_dataset(file_path=${JSON.stringify(upload_link)}, upload_method=${JSON.stringify(upload_method)}, datatype=${JSON.stringify(datatype)}, genome=${JSON.stringify(genome)}, server=${JSON.stringify(this.el.querySelector(".tool-migration-select").value)}, HistoryID=${JSON.stringify(history_id)} )`);
                
                    var DataListdiv = this.el.querySelector('.history-dataset-list');
                    
                    var e = this.el.querySelector('.list-item')
                    e.parentElement.removeChild(e)
                    DataListdiv.append(await this.data_row_list( history_id ))

                    var ListItem =  DataListdiv.querySelector('.list-item')
                    var data = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.OutPutData(server=${JSON.stringify(origin)}, JobID=${JSON.stringify(InitialData['jobs'][0]['id'])} )`);
                
                    await this.dataset_row_ok_state(ListItem, data[0],  history_id)
                }
            }  
        } 

        // this.hide_run_buttons(false)
    }

    async add_dataset_table(){

        var spn = this.el.querySelector('#datalist-update').querySelector('.fas.fa-spinner.fa-pulse')
        var update = this.el.querySelector('#datalist-update').querySelector('.fa.fa-refresh')

        spn.style.display = 'block'
        update.style.display = 'none'
        this.el.querySelector('#dataset-status-text').querySelector('b').style.display = 'block'

        var self = this

        if (this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        } else{
            var origin = this.model.get('origin')
        }

        var self = this

        const options = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.get_histories(server=${JSON.stringify(origin)})`)
        const select = document.createElement('select')

        if (this.el.querySelector(`#dataset-history-list`)){
            this.el.querySelector(`#dataset-history-list`).parentNode.removeChild(this.el.querySelector(`#dataset-history-list`))
        }

        select.id = `dataset-history-list`  
        select.className = 'InputData'   

        var DataListdiv = this.el.querySelector('.history-dataset-list');

        if (DataListdiv.children.length > 0 ){
            self.removeAllChildNodes(DataListdiv)
        }

        DataListdiv.append(await this.data_row_list(options[0]['id']))
    
        for (var i = 0; i < options.length; i++) {
            const opt = `${i+1}: ${options[i]['name']}`;
            const el = document.createElement("option");
            el.textContent = opt;
            el.value =  `${options[i]['id']}`;
            select.appendChild(el);
        }

        select.addEventListener("change", async () => {

            this.el.querySelector('#dataset-status-text').querySelector('b').style.display = 'block'
            spn.style.display = 'block'
            update.style.display = 'none'
     
            if (this.model.get('galaxy_tool_id') != "GiN_data_upload_tool"){

                self.removeAllChildNodes(DataListdiv)

                var form = self.element.querySelector('.Galaxy-form')
                var Inputs = await self.get_form_data(form)
                var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(Inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(select.value)}))\na = Temp()\na.Return()`)
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

                var FormParent = self.el.querySelector('.Galaxy-form')    
                self.removeAllChildNodes(FormParent)
                var selected_index = {}
                selected_index['HID'] = select.selectedIndex
                self.form_builder(refine_inputs['inputs'],  selected_index) 
                DataListdiv.append(await this.data_row_list(select.value))

            } else {
                self.removeAllChildNodes(DataListdiv )
                DataListdiv.append(await this.data_row_list(select.value))
            }

            spn.style.display = 'none'
            this.el.querySelector('#dataset-status-text').querySelector('b').style.display = 'none'
            update.style.display = 'block'
        });

        update.addEventListener('click', async () => {
            update.style.display = 'none'
            spn.style.display = 'block'
            this.el.querySelector('#dataset-status-text').querySelector('b').style.display = 'block'

            self.removeAllChildNodes(DataListdiv)    
            DataListdiv.append(await this.data_row_list( this.el.querySelector('#dataset-history-list').value))
            // await self.add_dataset_table()
            update.style.display = 'block'
            spn.style.display = 'none'

            this.el.querySelector('#dataset-status-text').querySelector('b').style.display = 'none'
        })

        var DataList = this.el.querySelector('#history-list')
        DataList.append(select)

        spn.style.display = 'none'
        update.style.display = 'block'
        this.el.querySelector('#dataset-status-text').querySelector('b').style.display = 'none'
    }

    // async add_history_list(){

    //     var self = this

    //     if(this.el.querySelector('.tool-migration-select')){
    //         var origin = this.el.querySelector('.tool-migration-select').value
    //     }  else{
    //         var origin = this.model.get('origin')
    //     }

    //     var histories = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.get_histories(server=${JSON.stringify(origin)})`)

    //     const options =  histories
    //     const select = document.createElement('select')
    //     select.id = `history_ids`  
    //     select.className = 'InputData'   

    //     for(var i = 0; i < options.length; i++) {
    //         const opt = `${i+1}: ${options[i]['name']}`;
    //         const el = document.createElement("option");
    //         el.textContent = opt;
    //         el.value =  `${options[i]['id']}`;
    //         select.appendChild(el);
    //     }

    //     // select.selectedIndex = selected_value
        
    //     select.addEventListener("change", async () => {

    //         var history_id = select.value

    //         if(this.el.querySelector('.tool-migration-select')){
    //             var server = this.el.querySelector('.tool-migration-select').value
    //         }  else{
    //             var server = this.model.get('origin')
    //         }

    //         if (this.model.get('galaxy_tool_id') != "GiN_data_upload_tool") {
    //             var form = self.element.querySelector('.Galaxy-form')
    //             var inputs = self.get_form_data(form)

    //             var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(server)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('galaxy_tool_id'))}, ${JSON.stringify(history_id)})`)
    //             var FormParent = self.el.querySelector('.Galaxy-form')    
    //             self.removeAllChildNodes(FormParent)
    //             var selected_index = {}
    //             selected_index['HID'] = select.selectedIndex
    //             self.form_builder(refine_inputs['inputs'],  selected_index)  
    //         }
    //     });

    //     var HistoryList = this.el.querySelector('.galaxy-history-list')
    //     HistoryList.append(select)
    // }
 
    AddHelpSection(help){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

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
                imgs[i].src = new URL(imgsrc, origin).href;
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

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

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
        row.style.display = 'block'
        row.id = input_def.id

        FormParent.append(outtitle)
        FormParent.append(row)
        FormParent.append(Button)
        FormParent.append(help)

        var click = input_def['min'];

        function add_internal_repeat(inputs, count){

            if(self.el.querySelector('.tool-migration-select')){
                var origin = self.el.querySelector('.tool-migration-select').value
            }  else{
                var origin = self.model.get('origin')
            }

            const row1 = document.createElement('div')
            row1.className = 'internal-ui-repeat section-row'
            row1['data-value'] = JSON.stringify({'count':count, "name":input_def.name})
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

                self.repeat_del['name'] = JSON.parse(e.target.parentNode.parentNode.parentNode['data-value'])['name']
                self.repeat_del['index'] = JSON.parse(e.target.parentNode.parentNode.parentNode['data-value'])['count']

                var history_id = self.element.querySelector('#dataset-history-list')
                var form = self.element.querySelector('.Galaxy-form')
                var Inputs = await self.get_form_data(form)

                var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(Inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id.value)}))\na = Temp()\na.Return()`)
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

                var FormParent = self.el.querySelector('.Galaxy-form')    
                self.removeAllChildNodes(FormParent)
                var selected_index = {}
                selected_index['HID'] = history_id.selectedIndex
                self.form_builder(refine_inputs['inputs'],  selected_index) 

                let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
                let fint = JSON.stringify(formdata)
                self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))  

            });

            row.append(row1)
        }

        if (this.repeat_del != "" && this.repeat_del['name'] == input_def['name']){

            delete input_def.cache[this.repeat_del['index']]

            if (input_def.cache ) {
                if (Object.keys(input_def.cache).length > 0 ){
                    input_def['min'] = Object.keys(input_def.cache).length
                    for (var j = 0; j < Object.keys(input_def.cache).length; j++){
                        add_internal_repeat(input_def.cache[Object.keys(input_def.cache)[j]], j)
                    }
                }
            }

            this.repeat_del = {'name':"", "index":""}

        } else {

            if (input_def.cache ) {
                if (Object.keys(input_def.cache).length > 0 ){
                    input_def['min'] = Object.keys(input_def.cache).length
                    for (var j = 0; j < Object.keys(input_def.cache).length; j++){
                        add_internal_repeat(input_def.cache[Object.keys(input_def.cache)[j]], j)
                    }
                }
            } else {

                if (input_def['min'] > 0){
                    for (var x =0; x < input_def['min']; x++) {
                        add_internal_repeat(input_def['inputs'], x)  
                    }
                } 
            }
        }

        Button.addEventListener("click", async (e)=>{ 
            var Count = row.children.length
            add_internal_repeat(input_def['inputs'], Count)
      
            var history_id = self.el.querySelector('#dataset-history-list').value
            var form = self.el.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(form)
            // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
           

            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(formdata)
            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
            
        });

        DeleteButton.addEventListener("click", async function(e){ 
            self.el.querySelector('.delete-button').closest('.internal-ui-repeat.section-row').remove()
            var history_id = self.el.querySelector('#dataset-history-list').value
            var form = self.el.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(form)
            // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)


            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(formdata)
            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
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

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        if (input_def.optional == true) {
            if (input_def.options.hda.length == 0){
                input_def.options.hda.push({'name':'No dataset is available', 'id':'', 'hid':''})
            } else{
                input_def.options.hda.push({'name':'Nothing selected', 'id': '', 'hid':''})
            }

            if (input_def.options.hdca.length == 0) {
                input_def.options.hdca.push({'name':'No dataset collection is available', 'id':'', 'hid':''})
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
            var children = self.el.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(children)

            var history_id = self.el.querySelector('#dataset-history-list').value
            // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
          
            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

            this.update_metadata_FormState('galaxy', refine_inputs['inputs'],  children)
            if (Select.multiple == true || FileManu['data-file']['batch'] == 'true'){

            } else{

                FileManu['data-file']['id'] = JSON.parse(Select.value)

                var FormParent = self.el.querySelector('.Galaxy-form')
                self.removeAllChildNodes(FormParent)
                self.form_builder(refine_inputs['inputs'])
            }

        }, false);

        FormParent.append(row)
        return row
    }
 
    add_select_field(input_def, FormParent, NamePrefix){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

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

            OuterDiv['data-value'] = JSON.stringify({"optional": input_def.optional, "name":input_def['name'], "value":input_def['value'] })
        
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

            Input.addEventListener('change', () => {
           
            })

            select_lable.append(Unselect)
            select_lable.append(selectspan)

            selectspan.addEventListener('click', async () => {
                for (var i = 0; i < OuterDiv.querySelectorAll('input').length; i++ ) {
                    OuterDiv.querySelectorAll('input')[i].checked = 'true'
                    // OuterDiv.querySelectorAll('input')[i].click()
                }

                var history_id = self.el.querySelector('#dataset-history-list').value 
                var form = self.el.querySelector('.Galaxy-form')
                var inputs = await self.get_form_data(form)
                // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)

                var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

                let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
                let fint = JSON.stringify(formdata)
                self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
            
            })
    
            Unselect.addEventListener('click', async () => {
                for (var i = 0; i < OuterDiv.querySelectorAll('input').length; i++ ) {
                    OuterDiv.querySelectorAll('input')[i].checked = 'false'
                    OuterDiv.querySelectorAll('input')[i].click()
                }
                var history_id = self.el.querySelector('#dataset-history-list').value
                
                var form = self.el.querySelector('.Galaxy-form')
                var inputs = await self.get_form_data(form)
                // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
               
                var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

                let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
                let fint = JSON.stringify(formdata)
                self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
            })

            row.append(TitleSpan)
            row.append(select_lable)
            row.append(OuterDiv)

            if (input_def.value && input_def.value.length > 0){
                for (var k = 0; k < input_def.options.length; k++){
                    for(var l = 0; l < input_def.value.length; l++){
                        if(input_def.value[l] == input_def.options[k][1]){
                            input_def.options[k][2] = true 
                        }
                    }
                }
            }

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

                CheckBoxInput.checked = input_def.options[i][2]

                CheckBoxInput.addEventListener('change', async () => {
                    var history_id = self.element.querySelector('#dataset-history-list').value
                    var form = self.el.querySelector('.Galaxy-form')
                    var inputs = await self.get_form_data(form)

                    // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)

                    var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
                    KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

                    // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
                    let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
                    let fint = JSON.stringify(formdata)
                    self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
                   
                    //  var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)

                })

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
            select.setAttribute('data-value', JSON.stringify({'optional': input_def.optional, 'value':input_def.value}))
        
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

            // var var_input =  document.createElement('input')
            // var_input.type = 'checkbox'
            // var_input.className = 'variable-checkbox'
    
            // var_input.style.marginRight = '5px;'
    
            // const title_1 = document.createElement('div')
            // title_1.className = 'ui-from-title'
            // const TitleSpan_1 = document.createElement('span')
            // TitleSpan_1.className = "variable-ui-form-title-text"
    
            // TitleSpan_1.textContent = 'Get value from local variable'
            // TitleSpan_1.style.marginLeft = "10px;"
    
            // title_1.append(var_input)
            // title_1.append(TitleSpan_1)

            row.append(title)
            row.append(select)
            // row.append(title_1)

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
                    var inputs = await self.get_form_data(children)
                    var history_id = self.el.querySelector('#dataset-history-list').value

                    // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
                   
                    var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
                    KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)
                   
                    var form_parent = self.el.querySelector('.Galaxy-form')
    
                    self.removeAllChildNodes(form_parent)
                    self.form_builder(refine_inputs['inputs'])
                    let formdata = children.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
                    let fint = JSON.stringify(formdata)
                    self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
                }
            });
        }
        FormParent.append(row)
        return row
    }
 
    add_boolean_field (input_def, FormParent, NamePrefix ){


        var self = this

        input_def.id = this.uid()

        const options =  [['Yes', true ],
                        ['No',  false]]

        const select = document.createElement('select')
        select.name = NamePrefix+input_def['name']

        for(var i = 0; i < 2; i++) {
            const opt = document.createElement("option");
            opt.textContent = options[i][0];
            opt.value = options[i][1];
            select.appendChild(opt);
 
            if(`${options[i][1]}` ==  `${input_def.default_value}`){
                opt.selected = true
            }
        }

        select.setAttribute('data-value', JSON.stringify({'optional': input_def.optional, 'value':input_def.value}))

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

        select.addEventListener('change', async (e) => {

            var history_id = self.el.querySelector('#dataset-history-list').value
            var form = self.el.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(form)
            // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
           
            if(this.el.querySelector('.tool-migration-select')){
                var origin = this.el.querySelector('.tool-migration-select').value
            }  else{
                var origin = this.model.get('origin')
            }

            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)
            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(formdata)
            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))

        })
        
        this.el.querySelector('.nbtools-form').append(row)
        FormParent.append(row)
        return row
    }

    collect_data() {
        const Childrens  = this.el.querySelector('.nbtools-form').children;
    }

    async add_conditional_section(input_def, parent, NamePrefix, call_back_data={}){

        if (this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        // ########################################################
        input_def.id = this.uid()
        var self = this

        var options = []

        if(input_def['test_param']['type'] == "boolean" ){
            options =  [['Yes', true ],
                    ['No',  false]]
        }else{
            options =  input_def['test_param']['options']
        }

        const select = document.createElement('select')
        select.name = NamePrefix+input_def['name']+"|"+input_def['test_param']['name']

        select.id = `select-${input_def.id}`    
        select.className = 'InputData' 

        select.setAttribute('data-value', JSON.stringify({'optional': input_def.optional, 'value':input_def.value}))
    
        for (var i = 0; i < options.length; i++) {
            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            el.value = options[i][1];
            select.appendChild(el);
        }

        for (var i, j = 0; i = select.options[j]; j++) {
            if (i.value == input_def.test_param.value) {
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

        for( var i = 0; i < options.length; i++ ) {
            if (input_def['test_param'].value == input_def['cases'][i]['value']) {
                for (var j in input_def.cases[i].inputs) {
                    this.add(input_def.cases[i].inputs[j], ConditionalDiv, NewNamePrefix, call_back_data)
                    input_def.cases[i].inputs[j].id = this.uid()
                }
            }
        }

        select.addEventListener("change", async () => {

            var queryID = select.value
            var form = self.element.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(form)
            self.removeAllChildNodes(ConditionalDiv)
            var history_id = self.element.querySelector('#dataset-history-list').value 
            // var refine_inputs = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)
           
           
            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)
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

            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML
            let fint = JSON.stringify(formdata)

            const utm = new DOMParser().parseFromString(JSON.parse(fint), 'text/html').querySelector('.nbtools.galaxy-uibuilder.lm-Widget.p-Widget')

            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))
        });

        parent.append(ConditionalDiv)
    }

    add_conditional_section_1(input_def, parent, NamePrefix, call_back_data={}){

        if (this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        // // // ########################################################
        input_def.id = this.uid()
        var self = this

        var options = []

        if(input_def['test_param']['type'] == "boolean" ){
            options =  [['Yes', true ],
                    ['No',  false]]
        }else{
            options =  input_def['test_param']['options']
        }

        const select = document.createElement('select')
        select.name = NamePrefix+input_def['name']+"|"+input_def['test_param']['name']
        select.setAttribute('data-value', JSON.stringify({'optional': input_def['test_param'].optional, 'value':input_def['test_param'].value}))

        select.id = `select-${input_def.id}`    
        select.className = 'InputData' 

        var options_list = []
    
        for (var i = 0; i < options.length; i++) {

            var div_uid = this.uid()
            options_list.push(div_uid )

            const opt = options[i][0];
            const el = document.createElement("option");
            el.textContent = opt;
            // el.value = div_uid;
            el.value = options[i][1];
            select.appendChild(el);
        }

        for (var j = 0; j < select.options.length; j++) {
            var option = select.options[j];
            if (option.value == input_def.test_param.value) {
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
        row.style.display = 'block'
        row.id = input_def.id
        row.append(title)
        row.append(select)
        parent.append(row)

        var NewNamePrefix = NamePrefix+input_def['name']+"|"
        input_def.id = this.uid()

        for( var i = 0; i < options.length; i++ ) {
          
            var ConditionalDiv = document.createElement('div')
            // ConditionalDiv.className = 'ui-form-element section-row pl-2'
            ConditionalDiv.id = options_list[i]

            if (input_def['test_param'].value == input_def['cases'][i]['value']) {
                    ConditionalDiv.style.display = 'block'
                    ConditionalDiv.className = 'ui-form-element section-row visible pl-2'
            }
            else{
                ConditionalDiv.style.display = 'none'
                ConditionalDiv.className = 'ui-form-element section-row pl-2'
            }

            for (var j in input_def.cases[i].inputs) {

                this.add(input_def.cases[i].inputs[j], ConditionalDiv, NewNamePrefix, call_back_data)
                input_def.cases[i].inputs[j].id = this.uid()
            }
            
            parent.append(ConditionalDiv)
        }

        select.addEventListener("change", (e) => {

            for (var i = 0; i <  options_list.length; i++){
                if (e.target.value == input_def['cases'][i]['value'] ){
                    self.el.querySelector(`#${options_list[i]}`).style.display = 'block'
                    self.el.querySelector(`#${options_list[i]}`).className = 'ui-form-element section-row visible pl-2'
                } else{
                    self.el.querySelector(`#${options_list[i]}`).style.display = 'none'
                    self.el.querySelector(`#${options_list[i]}`).className = 'ui-form-element section-row pl-2'
                }
            }
        });
    }
  
    add_section (input_def, parent, NamePrefix){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }
 
        var self = this
 
        var NewNamePrefix = NamePrefix+input_def['name']+"|"
        input_def.id = this.uid()
 
        const UpperDiv = document.createElement('div')
        UpperDiv.className = `ui-portlet-section section-row`
        UpperDiv.id = `${input_def.id}`


        const Button = document.createElement('button')
        Button.className = 'collapsible'
        Button.innerText = input_def['title']
 
        var SectionDiv  = document.createElement('div')
        UpperDiv.appendChild(Button)
 
        SectionDiv.className = `ui-form-element section-row sections`

        if(input_def.expanded){
            SectionDiv.style.display = 'block'
        }else{
            SectionDiv.style.display = 'none'
        }
        
        SectionDiv.id = `${input_def.id}-sections`
 
        UpperDiv.append(SectionDiv)
        parent.append(UpperDiv)
 
        function section(){
            for (var j in input_def['inputs']){
                self.add(input_def['inputs'][j], SectionDiv, NewNamePrefix)
            }
        }

        if(input_def['expanded']) {
            section()
        }
 
        Button.addEventListener("click", async (e) => {

            if (SectionDiv.childNodes.length == 0){
                section()
                this.section[input_def['name']] = true
                SectionDiv.style.display = 'block'
            } else{
                self.removeAllChildNodes(SectionDiv)
                this.section[input_def['name']] = false
                SectionDiv.style.display = 'none'
            }
            e.preventDefault();

            var history_id = self.el.querySelector('#dataset-history-list').value
            var form = self.el.querySelector('.Galaxy-form')
            var inputs = await self.get_form_data(form)
            // var refine_inputs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)})`)

            var refine_inputs = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.updated_form(${JSON.stringify(origin)}, json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), ${JSON.stringify(self.model.get('inputs')['id'])}, ${JSON.stringify(history_id)}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)


            let formdata = form.parentNode.parentNode.parentNode.parentNode.parentNode.outerHTML

            let fint = JSON.stringify(formdata)
            self.update_metadata_FormState('galaxy_tool', refine_inputs['inputs'], JSON.parse(fint))

        });
    }
 
    waitforme (milisec){
        return new Promise(resolve => {
            setTimeout(() => { resolve('') }, milisec);
        })
    }
 
    async data_row_list ( history_id){

        if(this.el.querySelector('.tool-migration-select')){
            var server = this.el.querySelector('.tool-migration-select').value
        }  else{
            var server = this.model.get('origin')
        }
        var data_list = document.createElement('ul')
        data_list.className = 'list-item'
        data_list.style.overflow = 'auto'
        data_list.style.height = '600px'
        data_list.style.overflowX = 'scroll'
        data_list.style.overflowY = 'scroll'
    
        // var datasets = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.history_data_list(server=${JSON.stringify(server)}, history_id=${JSON.stringify(history_id)} )`) 

        var datasets = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.history_data_list(server=${JSON.stringify(server)}, history_id=${JSON.stringify(history_id)} ))\na = Temp()\na.Return()`) 

        KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not define")`) 

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

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

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
                    // var dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_dataset_collection(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(dataset['id'])} )`)

                    var dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.show_dataset_collection(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(dataset['id'])}))\na = Temp()\na.Return()`)
                    KernelSideDataObjects('try:\n    del a\nexcept:\n    print("a is not defined")')
    
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
                            Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a>`
                        }                                                                                         
                        break;
                    }  
                    
                    else if (dataset['populated_state'] == 'error'){
                        Tbl.style.background = '#f4a3a5'
                        Tbl.className = `list-item ${dataset['history_content_type']} history-content state-error`
                    
                        if (Tbl.querySelector('.primary-actions')){
                            Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
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

                var URL = origin
                // var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_dataset_collection(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(dataset['id'])} )`) 

                var show_dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.show_dataset_collection(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(dataset['id'])}))\na = Temp()\na.Return()`)

               
                KernelSideDataObjects('try:\n    del a\nexcept:\n    print("a is not defined")')
        
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
                    KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(collection_id=${JSON.stringify(show_dataset['id'])}, server=${JSON.stringify(origin)}, file_name=${JSON.stringify(dataset['name'])}, data_type='collection')`);
                })
            }

            self.delete_dataset(Tbl, dataset['id'],  history_id, 'collection')
            return Tbl

        } else{
            //Need to be fixed: a separate dataaset_collection error widget  
            dataset['populated_state'] = 'error'
            dataset['history_content_type'] = 'dataset'
            // return this.dataset_row_error_state(dataset, history_id)
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
 
    preview_button_action(element){
        element.querySelector('.fa.fa-times').addEventListener('click', (e)=>{
            element.parentNode.removeChild(element)
            this.el.querySelector('.tool-forms').style.display = "block"
        })
    }

    async add_dataset(parent, dataset, history_id){

        if(this.el.querySelector('.tool-migration-select')){
            var URL = this.el.querySelector('.tool-migration-select').value
        }  else{
            var URL = this.model.get('origin')
        }

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
            Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
            
            var spn = document.createElement('li')
            spn.className =  "fa fa-times-circle"
            spn.style.color = 'red'
            Tbl.querySelector('.title-bar.clear').prepend(spn)
            }

        } else if (dataset['state'] == 'ok') {
            if (Tbl.querySelector('.primary-actions')){
                Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a>`
        
                //FixME:

                Tbl.querySelector('.fas.fa-eye').addEventListener('click', async ()=>{

                    // var apiKey = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.Return_api_key(${JSON.stringify(URL)})`)

                    var apiKey =  await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.Return_api_key(${JSON.stringify(URL)}))\na = Temp()\na.Return()`)
                    KernelSideDataObjects('try:\n    del a\nexcept:    print("a is not defined")')

                    var iframe_id = `${this.uid()}-iframe`
                    
                    var content = `<div class="preview"> 
                                        <div class="data-preview-header" style="width:100%; height:5%;"> 
                                            <div class="data-preview-header-icon" style="float: left" ><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a></div>
                                            <div class="data-preview-title" style="float: left">  <p class="title"> <b>${dataset['name']} </b></p> </div>
                                        </div>
                                        <div class="data-preview-content" style="width: 100%; height:100%;"> 
                                            <iframe  src="${URL}/datasets/${dataset['id']}/display/?preview=True&?api_key={%27x-api-key%27:%27${apiKey['api_key']}%27}" style="width: 100%; height:100%;" > </iframe>
                                        </div>
                                    </div>`

                    var tb = new DOMParser().parseFromString(content, 'text/html').querySelector('.preview')

                    this.removeAllChildNodes(this.el.querySelector('.data-preview'))
                    this.el.querySelector('.data-preview').append(tb)

                    this.el.querySelector('.tool-forms').style.display = "none"
                    this.preview_button_action(tb)

                });
            }
        } 

        else if (dataset['state'] == 'paused') {
            Tbl.style.background = '#daecf8'
            // Tbl.className = `list-item ${dataset['history_content_type']} history-content state-paused`
            if (Tbl.querySelector('.primary-actions')){
                Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
            }
        }

        parent.append(Tbl)

        var states = ['new', 'queued', 'running']
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

                //To fix the Kernel busy issue which is arising because of IPython.display.JSON,  an instance of the Temp class added and deleted once galaxy object returns.
                var data = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.show_data_set(server=${JSON.stringify(URL)}, dataset_id=${JSON.stringify(dataset['id'])} ))\na = Temp()\na.Return()`)
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

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

                    if (Tbl.querySelector('.primary-actions')){
                        Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a>`
                    }
                    Tbl.querySelector('.fas.fa-spinner.fa-spin, fa fa-clock-o').parentElement.removeChild(Tbl.querySelector('.fas.fa-spinner.fa-spin'))
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
                        Tbl.querySelector('.primary-actions').innerHTML = `<a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a>`
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
                var show_dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON([GalaxyTaskWidget.show_data_set(server=${JSON.stringify(URL)}, dataset_id=${JSON.stringify(dataset['id'])} )])\na = Temp()\na.Return()`) 
                KernelSideDataObjects(`del a`)
                var ok_details = await this.dataset_ok_details(show_dataset[0])
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
                KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(collection_id=${JSON.stringify(dataset['id'])}, server=${JSON.stringify(URL)} )`);
            })
        }

        this.delete_dataset(Tbl, dataset['id'],  history_id)

        return Tbl
    } 
     
    async dataset_row_ok_state (dataset, history_id){

        if(this.el.querySelector('.tool-migration-select')){
            var URL = this.el.querySelector('.tool-migration-select').value
        }  else{
            var URL = this.model.get('origin')
        }

        var row = `<div id="${dataset['type_id']}"   class="list-item ${dataset['history_content_type']} history-content state-ok" >
                    <div class="warnings"></div>
                    <div class="selector"><span class="fa fa-2x fa-square-o"></span></div>
                    <div class="primary-actions"><a class="icon-btn display-btn" title="" target="_blank" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fas fa-eye" style="" title="View Data" ></span></a><a class="icon-btn edit-btn" target="_blank"  href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" title="Edit data"></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style="" title="Delete" ></span></a><a class="icon-btn display-btn" title="" target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-download" style="" title="Download data to JupyterLab Server" ></span></a><a class="icon-btn display-btn"  target="" href="javascript:void(0);" data-original-title="View data"><span class="fa fa-exchange" style="" title="Send data to available tools"></span></a></div>
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

            if (Tbl.querySelector('#add_data_share_menu').style.display == 'block') {
                Tbl.querySelector('#add_data_share_menu').style.display = 'none'
            } 
            else{
                Tbl.querySelector('#add_data_share_menu').style.display = 'block'
            }
        })

        title.addEventListener('click', async (e) => {

            if (Tbl.querySelector('.details') == null ){

                //  var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(URL)}, dataset_id=${JSON.stringify(dataset['id'])} )`) 
                var show_dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON([GalaxyTaskWidget.show_data_set(server=${JSON.stringify(URL)}, dataset_id=${JSON.stringify(dataset['id'])} )])\na = Temp()\na.Return()`) 
                KernelSideDataObjects(`del a`)

                var ok_details = await this.dataset_ok_details(show_dataset[0])
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
            KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server(collection_id=${JSON.stringify(dataset['id'])}, server=${JSON.stringify(URL)} )`);
        })

        this.delete_dataset(Tbl, dataset['id'],  history_id)

        return Tbl
    } 
     
    async dataset_error_details (dataset){

        if(this.el.querySelector('.tool-migration-select')){
            var URL = this.el.querySelector('.tool-migration-select').value
        }  else{
            var URL = this.model.get('origin')
        }

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

        if(this.el.querySelector('.tool-migration-select')){
            var URL= this.el.querySelector('.tool-migration-select').value
        }  else{
            var URL = this.model.get('origin')
        }

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
                                    <a class="download-btn icon-btn"  href="${URL}/datasets/${dataset['id']}/display?to_ext=${dataset['extension']}" title="" data-original-title="Download"> <span class="fa fa-save" title="Download data"></span> </a><a class="icon-btn" title=""  href="${URL}/api/datasets/${dataset['id']}/display?to_ext=${dataset['name']}" data-original-title="Copy link"><span class="fa fa-chain" style="" title="Copy link"></span></a><a class="icon-btn params-btn" title="" target=""_blank" href="${URL}/datasets/${dataset['id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style="" title="Dataset details"></span></a><a class="icon-btn visualization-link" title="" target="_blank" href="${URL}/visualizations?dataset_id=${dataset['dataset_id']}" data-original-title="Visualize this data"><span class="fa fa-bar-chart" style="" title="Visualize"></span></a>
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

        if(this.el.querySelector('.tool-migration-select')){
            var URL = this.el.querySelector('.tool-migration-select').value
        }  else{
            var URL = this.model.get('origin')
        }

        var delete_button = row.querySelector('.fa.fa-times')

        if (delete_button != null){
            delete_button.addEventListener('click',  (e) => {
                delete_button.parentNode.parentNode.parentNode.parentNode.removeChild(delete_button.parentNode.parentNode.parentNode)
                if (datatype == 'dataset') {
                KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.delete_dataset(server=${JSON.stringify(URL)}, history_id=${JSON.stringify(history_id)}, dataset_id=${JSON.stringify(dataset_id)})`)
                } 
                else if (datatype == 'collection') {
                    KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.delete_dataset_collection(server=${JSON.stringify(URL)}, history_id=${JSON.stringify(history_id)}, dataset_collection_id=${JSON.stringify(dataset_id)})`)
                }    
            });
        }
    }
 
    copy_download_link (ok_details_html){

        var chain_button = ok_details_html.querySelector('.fa.fa-chain')
        chain_button.addEventListener('click', (e) => {

        });
    }
 
    async JobStatusTemplate (parent, job){

        if (this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var self = this

        var job_status = `<div class="job-status-widget">
                            <div class="job-header">
                                <div class="indicator" style="float:left;">
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
                                <div class="job-done-text" style="width:80%; float:left;">
                                    <div class="job-state-text" style="float:left;">
                                        Job queued                                        
                                    </div>
                                </div> 
                                
                                <div class="job-status-buttons" style="margin-top:3px; float:right;" >
                                    <a class="icon-btn display-btn" title=""  data-original-title="View data"><span class="fas fa-eye" style="" title="View job details" ></span></a><a class="icon-btn display-btn" title=""  data-original-title="View data"><span class="fa fa-refresh" style="" title="Reset tool form" ></span></a>
                                </div>
                            </div>

                            <div class="job-output-files" style="display: none">

                            </div>

                            <div class="job-status-footer" style="width:100%; height: 30px; color:white;" >
                           
                            </div>

                        </div>`

        const template = new DOMParser().parseFromString(job_status, 'text/html').querySelector('.job-status-widget')

        template.style.margin = '20px'

        // var apiKey = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.Return_api_key('${origin}')`)
        var apiKey =  await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.Return_api_key(${JSON.stringify(origin)}))\na = Temp()\na.Return()`)
        KernelSideDataObjects('try:\n    del a\nexcept:    print("a is not defined")')

        if (job['state'] != 'job failed') {
            template.querySelector('.job-status-footer').innerHTML = `<div style="padding:10px; font-size:15px;">Submitted by: <b> ${apiKey['email'] }</b> on <b>${job['create_time'].split('T')[0]}</b> at <b>${job['create_time'].split('T')[1].split('.')[0]}</div></b>`
            // template.querySelector('.job-id').innerHTML = `Job ID: <b> ${job['id']}</b>`
        }

        var tool_form = this.el.querySelector('.tool-forms')
        var BTN = template.querySelector('.fa.fa-refresh')

        BTN.addEventListener('click', async (e) => {

            self.hide_run_buttons(false)
            tool_form.style.backgroundColor = 'rgb(246,246,246)'
            self.el.querySelector('.Galaxy-form').style.display = 'block'
            // self.el.querySelector('.galaxy-history-list').style.display = 'block'
            var nodes = self.el.querySelectorAll('.job-status-widget')

            for (var i = 0; i < nodes.length; i++) {
                nodes[i].parentElement.removeChild(nodes[i])
            }
            
        });
    
        var BTNI = template.querySelector('.fas.fa-eye')

        BTNI.addEventListener('click', (e) => {

            if (template.querySelector('.job-output-files').style.display == 'block') {
                template.querySelector('.job-output-files').style.display = 'none'
            } else{
                template.querySelector('.job-output-files').style.display = 'block'
            }
        })

        var Table = `<div id ="${job['id']}" class="donemessagelarge">
                        <p> Executed <b>${this.model.get('name')}</b> and successfully added 1 job to the queue. </p>
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
            // var jb  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_job(server=${JSON.stringify(origin)}, job_id=${JSON.stringify(job["id"])})`)

            var jb = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.show_job(server=${JSON.stringify(origin)}, job_id=${JSON.stringify(job["id"])}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

            for (var j = 0; j < Object.keys(jb['inputs']).length; j++){

                var show_dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON([GalaxyTaskWidget.show_data_set(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(jb['inputs'][Object.keys(jb['inputs'])[j]]['id'])} )])\na = Temp()\na.Return()`) 
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)
    
                var ili  = document.createElement('li')
                var ib = document.createElement('b')
                ib.innerText = `${show_dataset[0]['name']}`
                ili.append(ib)
                inputs.append(ili)
            }
    
            for (var k =0; k < Object.keys(jb['outputs']).length; k++){
                var oli  = document.createElement('li')
                var ob = document.createElement('b')
                
                var show_dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON([GalaxyTaskWidget.show_data_set(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(jb['outputs'][Object.keys(jb['outputs'])[k]]['id'])} )])\na = Temp()\na.Return()`) 
                KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)
               
                ob.innerText =  `${show_dataset[0]['name']}`
                oli.append(ob)
                outputs.append(oli)
            }
            template.querySelector('.job-output-files').append(JobPanel)   
            this.input_output_file_status_update(template, job)
        } else{
            self.el.querySelector('.Galaxy-form').style.display = 'none'
            // self.el.querySelector('.galaxy-history-list').style.display = 'none'

            template.querySelector('.job-output-files').style.backgroundColor = 'pink'
            template.querySelector('.job-output-files').innerHTML = `<p> ${job['error']} </p>` 

            var job_done_text = template.querySelector(".job-state-text")
            job_done_text.innerText = 'Fatal Error'
            job_done_text.style.color = 'white'

            var gear_rotate = template.querySelector('.gear-rotate-icon')
            gear_rotate.style.display = 'none'

            var gear_rotate = template.querySelector('.job-error-icon')
            gear_rotate.style.display = 'block'

            // template.querySelector('.footer-txt').innerHTML = `<b> Job failed at submission</b> for more details view job details`
        }

        parent.append(template)
    }

    async input_output_file_name (parent, job){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var Table = `<div id ="${job['id']}" class="donemessagelarge">
                        <p> Executed <b>${this.model.get('name')}</b> and successfully added 1 job to the queue. </p>
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

        var jb  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_job(server=${JSON.stringify(origin)}, job_id=${JSON.stringify(job["id"])})`)

        for (var j =0; j < Object.keys(jb['inputs']).length; j++){
    
            // var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(jb['inputs'][Object.keys(jb['inputs'])[j]]['id'])} )`) 
            var show_dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON([GalaxyTaskWidget.show_data_set(server=${JSON.stringify(URL)}, dataset_id=${JSON.stringify(dataset['id'])} )])\na = Temp()\na.Return()`) 
            KernelSideDataObjects(`del a`)

            var ili  = document.createElement('li')
            var ib = document.createElement('b')
            ib.innerText = `${show_dataset['name']}`
            ili.append(ib)
            inputs.append(ili)
        }

        for (var k =0; k < Object.keys(jb['outputs']).length; k++){
            var oli  = document.createElement('li')
            var ob = document.createElement('b')

            var show_dataset = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON([GalaxyTaskWidget.show_data_set(server=${JSON.stringify(URL)}, dataset_id=${JSON.stringify(dataset['id'])} )])\na = Temp()\na.Return()`) 
            KernelSideDataObjects(`del a`)
            // var show_dataset = await KernelSideDataObjects(`from GiN.taskwidget  import GalaxyTaskWidget\nGalaxyTaskWidget.show_data_set(server=${JSON.stringify(origin)}, dataset_id=${JSON.stringify(jb['outputs'][Object.keys(jb['outputs'])[k]]['id'])} )`) 
            
            ob.innerText =  `${show_dataset['name']}`
            oli.append(ob)
            outputs.append(oli)
        }

        parent.append(JobPanel)
    }

    async input_output_file_status_update(parent, job_1){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var states = ['ok', 'error']

        for (let i = 0; i < Infinity; ++i) {

            // var job  = await KernelSideDataObjects(`from GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.show_job(server=${JSON.stringify(origin)}, job_id=${JSON.stringify(job_1['id'])})`)
            var job = await KernelSideDataObjects(`import IPython\nfrom GiN.taskwidget  import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.show_job(server=${JSON.stringify(origin)}, job_id=${JSON.stringify(job_1['id'])}))\na = Temp()\na.Return()`)
            KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)
        
            var job_state = job['state']

            if (job_state=='running'){

                var gear_rotate = parent.querySelector('.gear-rotate-icon')
                gear_rotate.style.display = 'block'

                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = `Job running, Job ID: ${job['id']}` 
                job_done_text.style.color = '#F5A207'

                var StdError  = parent.querySelector('.donemessagelarge')
                StdError.style.background = '#ffe6cd'
            } 

            else if (['queued', 'new'].includes(job_state)) {
                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = `Job queued Job ID: ${job['id']}` 

                var StdError  = parent.querySelector('.donemessagelarge')
                StdError.style.background = '#7d959d70'
            } 

            else if (job_state == 'ok'){
                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = `Job complete, Job ID: ${job['id']}`  

                var gear_rotate = parent.querySelector('.gear-rotate-icon')
                gear_rotate.style.display = 'none'

                var gear_rotate = parent.querySelector('.job-done-icon')
                gear_rotate.style.display = 'block'

                var StdError  =  parent.querySelector('.donemessagelarge')
                StdError.style.background = '#c2ebc2' 

                // parent.querySelector('.job-id').style.color = "rgb(81,219,81)"
            } 

            else if (job_state == 'error'){

                var job_done_text = parent.querySelector(".job-state-text")
                job_done_text.innerText = `Fatal Error Job ID: ${job['id']}`  
                job_done_text.style.color = 'white'

                var gear_rotate = parent.querySelector('.gear-rotate-icon')
                gear_rotate.style.display = 'none'

                var gear_rotate = parent.querySelector('.job-error-icon')
                gear_rotate.style.display = 'block'

                var StdError  = parent.querySelector('.donemessagelarge')
                StdError.style.background = '#f4a3a5'

                // parent.querySelector('.job-id').style.color = "red"
            }

            await this.waitforme(3000);

            if (states.includes(job_state) === true ) {
                break;
            }      
        }
    }

    async dataset_collection_list_item (show_dataset){


        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var self = this
        var URL = origin

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
                        <div class="primary-actions"><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['id']}/preview" data-original-title="View data"><span class="fa fa-eye" style=""></span></a><a class="icon-btn edit-btn" title="" href="${URL}/datasets/${dataset['id']}/edit" data-original-title="Edit attributes"><span class="fa fa-pencil" style=""></span></a><a class="icon-btn delete-btn" title="" href="javascript:void(0);" data-original-title="Delete"><span class="fa fa-times" style=""></span></a><a class="icon-btn display-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['dataset_id']}/display/?preview=True" data-original-title="View data"><span class="fa fa-eye" style=""></span></a></div>
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
                                <div class="left"><a class="icon-btn params-btn" title="" target="galaxy_main" href="${URL}/datasets/${dataset['id']}/show_params" data-original-title="View details"><span class="fa fa-info-circle" style=""></span></a><a class="icon-btn rerun-btn" title="" target="galaxy_main" href="${URL}/tool_runner/rerun?id=${dataset['dataset_id']}" data-original-title="Run this job again"><span class="fa fa-refresh" style=""></span></a><a class="icon-btn icon-btn" title="" href="#" data-original-title="Tool Help"><span class="fa fa-question" style=""></span></a></div>
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
            KernelSideDataObjects(`from GiN import GalaxyTaskWidget\nGalaxyTaskWidget.download_file_to_jupyter_server( server=${JSON.stringify(origin)}, collection_id=${JSON.stringify(elements['object']['id'])}) `);
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

    runAllGalaxyCells() {

        if (!ContextManager.notebook_tracker) return;               
        if (!ContextManager.notebook_tracker.currentWidget) return;
    
        var notebookTracker = ContextManager.notebook_tracker
    
        const notebook = notebookTracker.currentWidget.content
        const notebookSession = notebookTracker.currentWidget.context.sessionContext;
        const cells = notebook.widgets;
      
        notebookTracker.currentWidget.sessionContext.ready.then(() =>
        notebookTracker.currentWidget.revealed).then(() => {

            for (var i = 0; i < cells.length; i++){
                if (cells[i].model.metadata.get('galaxy_cell')){
                    if(cells[i].model.metadata.get('tool_type') !=  undefined) {
                        if(cells[i].model.metadata.get('tool_type') != 'login' ) {
                            notebook.activeCellIndex = i
                            removeAllChildNodes(cells[i].outputArea.node)
                            NotebookActions.run(notebook, notebookSession);
                        }
                    }
                }
            }
        });
    }
 
    activate_run_buttons (){

        var self  = this;
        this.el.querySelectorAll('.nbtools-run').forEach((button) => button.addEventListener('click', async () => {
            
            if (inputs == 'error'){
                return
            }

            var toolid =  "GiN_data_upload_tool"

            if (this.model.get('galaxy_tool_id') == toolid) {
                var a = async ()=>{
                    await KernelSideDataObjects(`from GiN.util import delete_file\ndelete_file()`)
                }

                a()

                this.dataupload_job()
            } else if (this.model.get('name') == 'login'){
                this.trigger_login()
            }else {
                var form = self.element.querySelector('.Galaxy-form')
                var inputs = this.get_form_data(form, true)

                console.log(inputs)


                if (inputs == 'error'){
                    return 
                }

                var history_id = self.element.querySelector('#dataset-history-list').value 

                this.SubmitJob(inputs, history_id)
                this.hide_run_buttons(true)
            }
        }));
    }

    async trigger_login(){

        // this.update_metadata_FormState({}, {})
        var logingForm = this.el.querySelector('.login-form-div')
        var formdata = logingForm.parentNode.parentNode.parentNode.parentNode.outerHTML       
        let fint = JSON.stringify(formdata)
        this.el.querySelector('#refresh-galaxy-cells').style.display = 'none'
        this.el.querySelector('.auth-error').style.display = 'none'
        this.el.querySelector('.auth-waiting').style.display = 'none';

        var credentials = { 'server':null, 'email':null, 'password':null,  'api_key': null }  
        var inputs = this.$(".tabcontent:visible")[0].querySelectorAll('input')

        for (var i = 0; i < inputs.length; i++){
            if (inputs[i].value == '' && inputs[i].style.display == 'block'){
                inputs[i].style.background = 'pink'
                return 
            }else if (inputs[i].value != '' && inputs[i].style.display == 'block'){
                inputs[i].style.background = ''
            }
        }

        this.el.querySelector('.auth-waiting').style.display = 'block';

        if (inputs[1].style.display == 'none'){
            credentials['server'] = inputs[0].value
            credentials['api_key'] = inputs[2].value
        }else if (inputs[1].style.display == 'block'){
            credentials['server'] = inputs[0].value
            credentials['email'] =  inputs[1].value
            credentials['password'] = inputs[2].value
        }

        var jobs = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.authwidget import GalaxyAuthWidget\na  = GalaxyAuthWidget()\na.login(json.loads(base64.b64decode("${btoa(JSON.stringify(credentials))}")))`)
           
        KernelSideDataObjects(`del a`)

        if (jobs.state === 'error' ) {

            this.el.querySelector('.auth-error').style.display = 'block'
            // this.el.querySelector('.login-form-div').style.display = "none";
            this.el.querySelector('.auth-waiting').style.display = 'none';
            this.el.querySelector('.auth-successful').style.display = 'none';

        } else if (jobs.state === 'success'){

            this.add_tools(jobs.tool_list)

            this.el.querySelector('.nbtools-subtitle').innerText = credentials['server']
            this.el.querySelector('.auth-successful').style.display = 'block';
            this.el.querySelector('.login-form-div').style.display = "none";
            this.el.querySelector('.auth-waiting').style.display = 'none';
            this.el.querySelector('.auth-error').style.display = 'none'
            this.el.querySelector('#refresh-galaxy-cells').style.display = 'block'
            this.hide_run_buttons(true)

            if (this.el.querySelector('#form-restore').checked ){

                if (!ContextManager.notebook_tracker) return;               
                if (!ContextManager.notebook_tracker.currentWidget) return;
                var notebookTracker = ContextManager.notebook_tracker

                const notebook = notebookTracker.currentWidget.content
                const notebookHasBeenRan = getRanNotebookIds().includes(notebook.id)
                // if(!notebookHasBeenRan) {
                    this.runAllGalaxyCells()
                // }
            }
        }
        
        Private.origins.push(credentials['server']); 
    }

    async SubmitJob(inputs, history_id){

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var toolforms = this.el.querySelector('.tool-forms') 
        var hl = this.el.querySelector('#dataset-history-list')

        for (var i = 0; i <  hl.options.length; i++ ){
            if (hl[i].value == history_id) {
                hl.selectedIndex = i
            }
        }

        // var jobs  = await KernelSideDataObjects(`import json\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.submit_job(gal_instance=${JSON.stringify(this.model.get('gal_instance'))}, tool_inputs=json.loads("""${JSON.stringify(inputs)}"""), history_id=${JSON.stringify(history_id)})`)
        // var jobs  = await KernelSideDataObjects(`import json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nGalaxyTaskWidget.submit_job(server=json.loads(base64.b64decode("${btoa(JSON.stringify(origin))}")), tool_id=json.loads(base64.b64decode("${btoa(JSON.stringify(this.model.get('galaxy_tool_id')))}")), tool_inputs=json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), history_id=json.loads(base64.b64decode("${btoa(JSON.stringify(history_id))}")))`)

        var jobs = await KernelSideDataObjects(`import IPython\nimport json\nimport base64\nfrom GiN.taskwidget import GalaxyTaskWidget\nclass Temp(object):\n    def Return(self):\n        return IPython.display.JSON(GalaxyTaskWidget.submit_job(server=json.loads(base64.b64decode("${btoa(JSON.stringify(origin))}")), tool_id=json.loads(base64.b64decode("${btoa(JSON.stringify(this.model.get('galaxy_tool_id')))}")), tool_inputs=json.loads(base64.b64decode("${btoa(JSON.stringify(inputs))}")), history_id=json.loads(base64.b64decode("${btoa(JSON.stringify(history_id))}"))))\na = Temp()\na.Return()`)
        KernelSideDataObjects(`try:\n    del a\nexcept:\n    print("a is not defined")`)

    if (jobs['state'] == 'job failed'){

        this.JobStatusTemplate(toolforms, jobs)

    } else {
            for (var i = 0; i < jobs['jobs'].length; i++ ) {
                this.JobStatusTemplate(toolforms, jobs['jobs'][i])
            }
            
            var data_list_div = this.el.querySelector('.history-dataset-list');
            var e = this.el.querySelector('.list-item')
            e.parentElement.removeChild(e)
            data_list_div.append(await this.data_row_list( history_id))
            this.el.querySelector('.Galaxy-form').style.display = 'none'
            // this.el.querySelector('.galaxy-history-list').style.display = 'none'
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

        if(this.el.querySelector('.tool-migration-select')){
            var origin = this.el.querySelector('.tool-migration-select').value
        }  else{
            var origin = this.model.get('origin')
        }

        var url = origin
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

    register_button() {

        this.el.querySelector('.nbtools-buttons').querySelector('button').addEventListener('click', ()=>{
            window.open('https://usegalaxy.org/login/start?redirect=None', '_blank');
        })
    }
    
    _submit_keypress() {
       
    }
 }