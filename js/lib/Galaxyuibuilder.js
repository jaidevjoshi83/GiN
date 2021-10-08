/**
 * Define the UI Builder widget for Jupyter Notebook
 *
 * @author Thorin Tabor
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */
 import '../style/Galaxyuibuilder.css';
 import { MODULE_NAME, MODULE_VERSION } from './version';
 import { unpack_models } from "@jupyter-widgets/base";
 //import { UIBuilderModel, UIBuilderView } from "@genepattern/nbtools";
 import { BaseWidgetModel, BaseWidgetView } from "@genepattern/nbtools";
 import { element_rendered, toggle } from "./utils";
 import { ContextManager } from '@genepattern/nbtools';
 import { SessionContext, sessionContextDialogs, } from '@jupyterlab/apputils';
 import { KernelModel } from './model';
 import _ from "underscore";
 
 export class GalaxyUIBuilderModel extends BaseWidgetModel{
     
     defaults() {
         return Object.assign(Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyUIBuilderModel.model_name, _model_module: GalaxyUIBuilderModel.model_module, _model_module_version: GalaxyUIBuilderModel.model_module_version, _view_name: GalaxyUIBuilderModel.view_name, _view_module: GalaxyUIBuilderModel.view_module, _view_module_version: GalaxyUIBuilderModel.view_module_version, name: 'Python Function', description: '', origin: '', _parameters: [], parameter_groups: [], function_import: '', register_tool: true, collapse: true, events: {}, buttons: {}, display_header: true, display_footer: true, busy: false, run_label: 'Execute', GalInstace: {}, output: undefined, inputs:[], form_output:{}, History_Data:[], UI:{}, ToolID:'' }));
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
 
     }
 
     render() {
 
         // super.render()
         // this.activate_run_buttons();
         // this.toggle_code(false);
 
         super.render();
 
         const inputs = this.model.get('inputs')
 
         // console.log(inputs)
         
         //########################
 
         this.CreateForm()
         var self = this;
 
         var FormParent = this.el.querySelector('.Galaxy-form');

        //  var HistoryList =  this.AddHistoryList()
        //  FormParent.append(HistoryList)
 
         // console.log(inputs)
 
         this.Main_Form(inputs)
 
         // _.each(inputs, (input) => {
         //     self.add(input, FormParent, '');
         // });
 
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
 
     Main_Form (inputs, selected_value='default') {
 
         var FormParent = this.el.querySelector('.Galaxy-form');

         var HistList = this.AddHistoryList(selected_value)
         FormParent.append(HistList)

         var self = this
         _.each(inputs, (input) => {
             self.add(input, FormParent, '', selected_value);
         });
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
 
     
     ReturnData(FormEelements){
 
         var InputPerameters = {}
 
         for (var i = 0; i < FormEelements.length; i++) {

            if (FormEelements[i].className == 'ui-form-element section-row'){
                 var tableChild = FormEelements[i];
                 InputPerameters[tableChild.querySelector('.InputData').name] = tableChild.querySelector('.InputData').value
             
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
 
     add  ( input, FormParent, NamePrefix, selected_index='default' ) {
         
         var input_def = input;
        // input_def.id = this.uid();


        if (input_def.id == 'undefined') {
            input_def.id = this.uid()
        }
   
         switch (input_def.type) {

             case "conditional":
                 this.AddConditoinalSection2(input_def, FormParent, NamePrefix);
                 break;
             case "data":
                 this.FileUpLoad(input_def, FormParent, NamePrefix, selected_index)
                 break
             case "text":
                 this.AddText(input_def, FormParent, NamePrefix);
                 // this.el.querySelector('.Galaxy-form').append(this.AddText(input_def))
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
 
         }
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
         row.append(title)
         row.append(input)
         FormParent.append(row)
         return row
     }


     AddHistoryList(Selected_value, selected_value='default') {

        var self = this

        const options =  this.model.get('History_IDs')
        const select = document.createElement('select')
        select.id = `History_IDs`  
        select.className = 'InputData'   
        // select.name = NamePrefix+input_def['name']
     
        for(var i = 0; i < options.length; i++) {
              const opt = `${i}: ${options[i]['name']}`;
              const el = document.createElement("option");
              el.textContent = opt;
              el.value =  `${options[i]['id']}`;
              select.appendChild(el);
        }


        if (selected_value == 'default') {


            for(var i, j = 0; i = select.options[j]; j++) {
                if(i.value == Selected_value) {
                    select.selectedIndex = j;
                    break;
                }
            }
        }


        const HistoryList = document.createElement('div')

        const title = document.createElement('div')
        title.className = 'history-title'
        const TitleSpan = document.createElement('span')
        TitleSpan.className = "galaxy-history-title"
        TitleSpan.textContent = 'History List'
        TitleSpan.style.display = 'inline'
        title.append(TitleSpan)
        HistoryList.append(title)

        HistoryList.className = "galaxy-history-list"
        HistoryList.append(select)


        select.addEventListener("change", () => {
 
            var HistoryID = select.value

            // console.log(queryID )


            var children = self.element.querySelector('.Galaxy-form').children;
            var Inputs = self.ReturnData(children)

            const notebook = ContextManager.tool_registry.current
            var future = notebook.context.sessionContext.session.kernel.requestExecute({code: `from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(${JSON.stringify(self.model.get('GalInstace'))}, ${JSON.stringify(Inputs)}, ${JSON.stringify(self.model.get('ToolID'))}, ${JSON.stringify(HistoryID)})`})  

 
             future.onIOPub  = (msg) => {
 
                const msgType = msg.header.msg_type;
                switch (msgType) {
                  case 'execute_result':
                  case 'display_data':
                  case 'update_display_data':
                    future.onIOPub = msg.content;
 
                    let refine_inputs = future.onIOPub.data['application/json'];
 
                        var FormParent = self.el.querySelector('.Galaxy-form')
                        self.removeAllChildNodes(FormParent)
 
                        //######################################## //Fix me in future
 
                        const Button = document.createElement('button')
                        Button.style.display = 'none'
                        Button.type = 'button'
                        Button.id = 'submit'
                        Button.className  = 'Galaxy-form-button'
                
                        FormParent.append(Button)
 
                        //########################################
 
                     try { 

                        self.Main_Form(refine_inputs, HistoryID);
                      } catch(err){
                        console.log(err);
                      }
 
                    break;
                  default:
                    break;
                }
                 return
              };


        });

        return HistoryList

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
        
        // row.append(input)
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
 
     FileUpLoad (input_def, FormParent, NamePrefix, selected_index='default') {
 
         input_def.id = this.uid()
         var self = this
 
         const title = document.createElement('div')
         title.className = 'ui-from-title'
         const TitleSpan = document.createElement('span')
         TitleSpan.className = "ui-form-title-text"
         TitleSpan.textContent = input_def.label
         TitleSpan.style.display = 'inline'
         title.append(TitleSpan)
         const Label = document.createElement('label')
         Label.className = 'custom_file_upload'
         const Div = document.createElement('div')
         const row = document.createElement('div')
      
         var options = input_def.options
         const DataSelect = document.createElement('select')
         DataSelect.id = `select-${input_def.id}`  
         DataSelect.className = 'InputData'   
         DataSelect.name = NamePrefix+input_def['name']
      
         for (var i = 0; i < options['hda'].length; i++) {
             const opt = options['hda'][i].name;
             const el = document.createElement("option");
             el.textContent = opt;
             el.value = 'Input_data:'+JSON.stringify({'values': [options['hda'][i]]}) //Fix me 
             // el.value = JSON.stringify({'values': [options['hda'][i]]})
             DataSelect.appendChild(el);
         }
 
         for (var i, j = 0; i = DataSelect.options[j]; j++) {
 
             // console.log(i.value.split(":")[3].replace('"',"").split(',')[0].replace('"',''), input_def.value.values[0]['id'])
             // console.log(JSON.parse(i.value.split('Input_data:')[1])['values'][0]['id'])
 
             if (input_def.value == null) {
                 DataSelect.selectedIndex = 0;
             } else {
 
                 if (JSON.parse(i.value.split('Input_data:')[1])['values'][0]['id'] == input_def.value.values[0]['id']) { //fix me 
                     DataSelect.selectedIndex = j;
                     break;
                 }
 
             }
 
         }
 
         const Li = document.createElement('i')
         Li.innerText = ' Upload Data'
         Li.className = "fa fa-cloud-upload"
         Label.append(Li)
 
         row.className = 'ui-form-element section-row'
         row.id = input_def.id
         row.append(title)
         row.append(Label)
         row.append(DataSelect)
 
         var children = self.element.querySelector('.Galaxy-form').children;
         var Inputs = self.ReturnData(children)
 
         DataSelect.addEventListener("change", function() {
 
             var children = self.element.querySelector('.Galaxy-form').children;
             var Inputs = self.ReturnData(children)


             var HistoryID = self.element.querySelector('#History_IDs').value
 

             const notebook = ContextManager.tool_registry.current
             var future = notebook.context.sessionContext.session.kernel.requestExecute({code: `from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(${JSON.stringify(self.model.get('GalInstace'))}, ${JSON.stringify(Inputs)}, ${JSON.stringify(self.model.get('ToolID'))}, ${JSON.stringify(HistoryID)})`})    
         
             future.onIOPub  = (msg) => {
                  var queryID  = DataSelect.selectedIndex
 
                 const msgType = msg.header.msg_type;
                 switch (msgType) {
                   case 'execute_result':
                   case 'display_data':
                   case 'update_display_data':
                     future.onIOPub = msg.content;
 
                     let refine_inputs = future.onIOPub.data['application/json'];
                     // if (refine_inputs.startsWith("'")){
                     //     refine_inputs = refine_inputs.slice(1,-1);
                     // }
                     try { 
                        
                         var FormParent = self.el.querySelector('.Galaxy-form')
                         self.removeAllChildNodes(FormParent)
 
                         //######################################## //Fix me in future
 
                         const Button = document.createElement('button')
                         Button.style.display = 'none'
                         Button.type = 'button'
                         Button.id = 'submit'
                         Button.className  = 'Galaxy-form-button'
                    
                         FormParent.append(Button)
 
                         //########################################
 
                         self.Main_Form(refine_inputs)
                       } catch(err){
                         console.log(err);
                       }
 
                     break;
                   default:
                     break;
                 }
                  return
               };
 
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
 
     AddConditionalSelectField (input_def, ElID, NamePrefix) {


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
         
         select.addEventListener("change", () => {
 
             // //##################################### Recently Added 
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

            const notebook = ContextManager.tool_registry.current
            var future = notebook.context.sessionContext.session.kernel.requestExecute({code: `from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.UpdateForm(${JSON.stringify(self.model.get('GalInstace'))}, ${JSON.stringify(Inputs)}, ${JSON.stringify(self.model.get('ToolID'))}, ${JSON.stringify(HistoryID)})`})  

 
             future.onIOPub  = (msg) => {
 
                const msgType = msg.header.msg_type;
                switch (msgType) {
                  case 'execute_result':
                  case 'display_data':
                  case 'update_display_data':
                    future.onIOPub = msg.content;
 
                    let refine_inputs = future.onIOPub.data['application/json'];
 
                        var FormParent = self.el.querySelector('.Galaxy-form')
                        self.removeAllChildNodes(FormParent)
 
                        //######################################## //Fix me in future
 
                        const Button = document.createElement('button')
                        Button.style.display = 'none'
                        Button.type = 'button'
                        Button.id = 'submit'
                        Button.className  = 'Galaxy-form-button'
                
                        FormParent.append(Button)
 
                        //########################################
 
                     try { 

                        self.Main_Form(refine_inputs);
                      } catch(err){
                        console.log(err);
                      }
 
                    break;
                  default:
                    break;
                }
                 return
              };
 
             //##################################### Recently Added 
 
         });
 
         //#################### Recently Added 
         // FormParent.append(row)
         //#################### Recently Added 
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
     
             // TitleSpan.style.display = 'inline'
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
 
 
     AddConditoinalSection2 (input_def, parent, NamePrefix) {
 
         // console.log(input_def['test_param']['options'])
 
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
 
                     this.add(input_def.cases[l].inputs[j], ConditionalDiv, NewNamePrefix )
                       
                     input_def.cases[l].inputs[j].id = this.uid()
         
                   }
             }
          }
 
           parent.append(ConditionalDiv)
         }
     }
     //#############################################################################
 
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
 
             // console.log(nextSibling.id)
 
             if (nextSibling.style.display == 'none'){
                 nextSibling.style.display = 'block'
             } else {
                 nextSibling.style.display = 'none'
             }
         });
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
             // Execute the interact instance
            //this.el.querySelector('.widget-interact > .jupyter-button').click();
 
            this.el.querySelector('#submit').click();
 
            // console.log('@@@@@@@@@@@@@@@@@@@@');
            const notebook = ContextManager.tool_registry.current


            var HistoryID = self.element.querySelector('#History_IDs').value
 
            var children = self.element.querySelector('.Galaxy-form').children;
            var Inputs = self.ReturnData(children)
            // console.log(Inputs)
            notebook.context.sessionContext.session.kernel.requestExecute({code: `from galaxylab import GalaxyTaskWidget\nGalaxyTaskWidget.submit_job(${JSON.stringify(this.model.get('GalInstace'))}, ${JSON.stringify(Inputs)}, ${JSON.stringify(HistoryID)})`})
 
            // console.log('@@@@@@@@@@@@@@@@@@@@');
 
             // Collapse the widget, if collapse=True
 
             if (this.model.get('collapse'))
                 this.el.querySelector('.nbtools-collapse').click();
         }));
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
 