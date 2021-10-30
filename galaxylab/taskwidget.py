import inspect
import os
import tempfile
import IPython
from .jobwidget import GalaxyJobWidget
from nbtools import NBTool,  python_safe, EventManager
from .Galaxyuibuilder import GalaxyUIBuilder
from .shim import  get_kinds
from .util import DEFAULT_COLOR, DEFAULT_LOGO
import bioblend
from bioblend.galaxy.objects import *
import json5
import logging
import pickle
import json
import IPython.display


class GalaxyTaskWidget(GalaxyUIBuilder):
    """A widget for representing the status of a Galaxy job"""
    #default_color = 'rgba(10, 45, 105, 0.80)'
    default_color = DEFAULT_COLOR
    default_logo = DEFAULT_LOGO
    tool = None
    function_wrapper = None
    ann = None
    parameter_spec = None
    upload_callback = None
    hdata = None
    Hlist = None
    #job = None

    def create_function_wrapper(self, tool):
        gi = tool.gi.gi #tool.gi is oo gi, gi.gi is original gi
        """Create a function that accepts the expected input and submits a Galaxy job"""
        #if task is None or task.server_data is None: return lambda: None  # Dummy function for null task
        name_map = {}  # Map of Python-safe parameter names to Galaxy parameter names
        # Function for submitting a new Galaxy job based on the task form

        def submit_job(**kwargs):

            # print('ok')
            tool_id  = tool.wrapped['id']
            inputs = kwargs
            History_ID = inputs['History_list']
            
            ###########################process inputs#########################
            for a in kwargs.keys():
                if 'Input Data ID :' in str(kwargs[a]):
                    data_id = kwargs[a].split(':')[1]
                    data_src = gi.datasets.show_dataset(dataset_id=data_id)['hda_ldda']
                    inputs[a] = {'src':data_src,'id':data_id}
            ###########################process inputs#########################  

            ###########################Job run ######################### 
            self.job = gi.tools.run_tool(history_id=History_ID, tool_id=tool_id, tool_inputs=inputs)
            ###########################Job run######################### 
            #self.job = 

            IPython.display.display(GalaxyJobWidget(self.job, gi))
            ##########################Job run ######################### 

        submit_job.__qualname__ = tool.wrapped['name']
        submit_job.__doc__ = tool.wrapped['description']

        params = []
        hdn = tool.wrapped['inputs']
        counter = 0

        for h in hdn:
            if h['type'] == 'data': 
                counter = counter + 1
            else:
                pass
        
        ############# Generating tool wrapper for history data ####################
        ds = gi.datasets.get_datasets()
        options = []

        for d in ds:
            if d['deleted'] == True:
                pass
            else:
                options.append(("%s (%s: #%s in %s)" % (d['name'], d['id'], d['hid'], d['history_id']),d['id']))
        
        #options = [['Select History Data', None]]+ options 
        
        self.hdata = [{'name':'History_Data'+str(i+1), 'value':'', 'type':'history_data', 'optional':False, 'label':'History Data', 'options':options} for i,_ in enumerate(range(counter))]
        ############################################################################
        
        #####################Generating tool wrapperr for History#####################
        Hs = gi.histories.get_histories()
        Hoptions = []
        
        for H in Hs:
            Hoptions.append(["%s (%s)" % (H['name'],H['id']),H['id']])
            
        self.Hlist = [{'name':'History_list', 'value':'', 'type':'history_list', 'optional':False, 'label':'History list', 'options':Hoptions}]

        ##############################################################################
            
        for  a in tool.wrapped['inputs']+self.Hlist:
            safe_name = python_safe(a['name'])
            name_map[safe_name] = a['name']
            param = inspect.Parameter(safe_name, inspect.Parameter.POSITIONAL_OR_KEYWORD)
            params.append(param)

        submit_job.__signature__ = inspect.Signature(params)

        return submit_job

        #####################


    def RetrivParm(inputs, prefix=''):
        
        OutDict = {}
        
        for i in inputs:

            full_name = prefix+i['name']

            OutDict[full_name] = i
            if i['model_class'] == 'Conditional':
                for j in i['cases']:
                    Dict1 = GalaxyTaskWidget.RetrivParm(j['inputs'], full_name+'|')
                    OutDict = dict(list(OutDict.items()) + list(Dict1.items()))
            elif i['model_class'] == 'Repeat':
                Dict2 = GalaxyTaskWidget.RetrivParm(i['inputs'], full_name+'|')
                OutDict = dict(list(OutDict.items()) + list(Dict2.items()))
            elif i['model_class'] == 'Section':
                    Dict3 =  GalaxyTaskWidget.RetrivParm(i['inputs'], full_name+'|')  
                    OutDict = dict(list(OutDict.items()) + list(Dict3.items()))
                    
        return OutDict



    def submit_job(GInstace, Tool_inputs, HistoryID):

        gi = GalaxyInstance(GInstace['URL'], email=GInstace['email_ID'], api_key=GInstace['API_key'], verify=True)
        tool_inputs  = json5.loads(Tool_inputs)

        print(tool_inputs)

        NewInputs = GalaxyTaskWidget.RefinedInputs(tool_inputs, gi)

        print('##### its job sbumit ########')
        print(NewInputs)
        print('##### its job sbumit ########')

        job = gi.tools.gi.tools.run_tool(history_id=HistoryID, tool_id=GInstace['tool_ID'], tool_inputs=NewInputs)

        IPython.display.display(GalaxyJobWidget(job, gi.gi))

    def RefinedInputs(inputs, gi):
    
        for i in inputs.keys():
            if type(inputs[i]) == dict:
                if list(inputs[i].keys())[0] == 'values':
                    new_values = []
                    for j in inputs[i]['values']:
                        Dataset = gi.gi.datasets.gi.datasets.show_dataset(dataset_id=j)
                        new_values.append({'src':Dataset['hda_ldda'],'id':Dataset['id']})
                    inputs[i]['values'] = new_values
        return inputs


    def UpdateForm(GInstace={}, Tool_inputs=None, toolID=None, HistoryID=None, Python_side=False, InputDataParam=False):


        gi = GalaxyInstance(GInstace['URL'], email=GInstace['email_ID'], api_key=GInstace['API_key'], verify=True)
       
        if (Tool_inputs != None) and (toolID != None):

            NewInputs = GalaxyTaskWidget.RefinedInputs(Tool_inputs, gi)
         
            print('newinputs')
            print(Tool_inputs)
            print('newinputs')

            inputs = gi.gi.tools.gi.tools.build_tool(tool_id=toolID, inputs=NewInputs, history_id=HistoryID)

            # print('############','UpdateForm 1')
            # print(inputs)
            # print('############','UpdateForm 1')

            if InputDataParam == False:
                return IPython.display.JSON(data=inputs)
            else:
                print('############','Up')
                print(GalaxyTaskWidget.RetrivParm(inputs['inputs']) )
                return IPython.display.JSON(GalaxyTaskWidget.RetrivParm(inputs['inputs']))
                
        

        else:
            HistoryData = gi.gi.datasets.gi.datasets.get_datasets(history_id=HistoryID, state='ok', deleted=False,  purged=False, visible=True)

            if Python_side==True:
                return HistoryData
            else:
                return IPython.display.JSON(data=HistoryData)


        # return inputs['inputs']
        
    def add_type_spec(self, task_param, param_spec): 
        
        if 'test_param' in task_param.keys():
            if task_param['test_param']['type'] == 'select':  
                param_spec['type'] = 'choice'
                param_spec['choices'] = {i[0]:i[1] for i in task_param['test_param']['options']} 
                
        if task_param['type'] == 'data':
            param_spec['type'] = 'file'
            param_spec['choices'] = {i[0]: 'Input Data ID :'+ i[1] for i in self.hdata[0]['options']} 
        elif task_param['type'] == 'select':
            param_spec['type'] = 'choice'
            param_spec['choices'] = {i[0]:i[1] for i in task_param['options']} 
        elif task_param['type']  == 'integer':
            param_spec['type'] = 'number'
        elif task_param['type'] == 'float':
            param_spec['type'] = 'number'
        elif task_param['type'].lower() == 'password':
            param_spec['type'] = 'password'
        elif task_param['type'] == 'boolean':
            param_spec['type'] = 'bool'
        elif 'history_list' == task_param['type']:
            param_spec['type'] = 'choice'
            param_spec['choices'] = {i[0]:i[1] for i in task_param['options']}   
       
        elif 'tesk_param' in task_param.keys():
            if task_param['test_param']['type'] == 'select':
                param_spec['choices'] = {i[0]:i[1] for i in task_param['test_param']['options']}     
            param_spec['type'] = 'choice'
            param_spec['choices'] = {i[0]:i[1] for i in task_param['tesk_param']['options']} 
            
        else: 
            param_spec['type'] = 'text'

    def create_param_spec(self, task):
        """Create the display spec for each parameter"""
        if task is None: return {}  # Dummy function for null task
        spec = {}
        # for p in task.wrapped['inputs']+self.hdata+self.Hlist:
        #     safe_name = python_safe(p['name'])
        #     spec[safe_name] = {}
        #     spec[safe_name]['default'] = p['name']
        #     if p['type'] == 'data':
        #         spec[safe_name]['default'] = 'Input File'
                
        #     if 'test_param' in p.keys():
        #         if p['test_param']['value'] == None:
        #             spec[safe_name]['default'] = 'Input File'
        #         else: 
        #             spec[safe_name]['default'] = GalaxyTaskWidget.form_value(p['test_param']['value'])
        #     else:
        #         if p['value'] == None:
        #             spec[safe_name]['default'] = 'Input File'
        #         else: 
        #             spec[safe_name]['default'] = GalaxyTaskWidget.form_value(p['value'])
                       
        #     if p['type'] == 'history_list':
        #          spec[safe_name]['default'] == "Select History"
                    
        #     if 'test_param' in p.keys():
        #         spec[safe_name]['description'] = GalaxyTaskWidget.form_value(p['test_param']['label'])
        #     else:
        #         spec[safe_name]['description'] = GalaxyTaskWidget.form_value(p['label'])
                
        #     if 'test_param' in p.keys():                                                                                                                    
        #         spec[safe_name]['optional'] = p['test_param']['optional']
        #     else:
        #         spec[safe_name]['optional'] = p['optional']
        #     spec[safe_name]['kinds'] = []
        #     self.add_type_spec(p, spec[safe_name])
        return spec

    @staticmethod
    def extract_parameter_groups(task):
        if 'paramGroups' in task.dto and (len(task.dto['paramGroups']) > 1 or 'name' in task.dto['paramGroups'][0]):
            groups = task.dto['paramGroups']
            for group in groups:
                if 'parameters' in group:
                    for i in range(len(group['parameters'])):
                        group['parameters'][i] = python_safe(group['parameters'][i])
            return groups
        else:
            return []

        """Create an upload callback to pass to file input widgets"""

    def generate_upload_callback(self):

        def galaxy_upload_callback(values):
            gi = self.tool.gi.gi
            for k in values:
                with tempfile.NamedTemporaryFile() as f:
                    f.write(values[k]['content'])
                    f.flush()
                    a = gi.tools.upload_file(os.path.realpath(f.name), self.Hlist[0]['options'][0][1], file_name=k) 
                    return 'Input Data ID :'+a['outputs'][0]['id']
        return galaxy_upload_callback

    def handle_error_task(self, error_message, name='Galaxy Module', **kwargs):
        """Display an error message if the task is None"""
        UIBuilder.__init__(self, lambda: None, color=self.default_color, **kwargs)

        self.name = name
        self.display_header = False
        self.display_footer = False
        self.error = error_message


    def ReturnHistoryData(self , tool):
        return HData



    def __init__(self, tool=None, **kwargs):

        """Initialize the task widget"""

        self.tool = tool
        self.function_wrapper = self.create_function_wrapper(self.tool) 
        # self.function_wrapper = None

        self.galInstace = { 
                            "API_key":  self.tool.gi.gi.key,
                            "email_ID": self.tool.gi.gi.users.get_current_user()['email'],
                            "URL":      self.tool.gi.gi.base_url,
                            "tool_ID": self.tool.wrapped['id'],
                         }

        #if self.tool is None or self.function_wrapper is None:  # Set the right look and error message if task is None
        #   self.handle_error_task('Job Error.', **kwargs)
        #else:
        # self.function_wrapper = self.create_function_wrapper(self.tool) 
        #print (self.function_wrapper)   

        self.parameter_spec = self.create_param_spec(self.tool) # Create run task function
        # self.parameter_spec = None
        self.History_IDs = self.tool.gi.histories.gi.histories.get_histories()

        inputs = self.tool.gi.tools.gi.tools.build_tool(tool_id=tool.wrapped['id'], history_id=self.History_IDs[0]['id'])


        self.HistoryData = GalaxyTaskWidget.UpdateForm(GInstace=self.galInstace, HistoryID=self.History_IDs[0]['id'], Python_side=True)


        GalaxyUIBuilder.__init__(self, self.function_wrapper, inputs, self.History_IDs, self.HistoryData, self.galInstace, tool.wrapped['id'], parameters=self.parameter_spec,
                           color=self.default_color,
                           logo=self.default_logo,
                           upload_callback=self.generate_upload_callback(),
                            **kwargs)
    @staticmethod
    def form_value(raw_value):
        """Give the default parameter value in format the UI Builder expects"""
        if raw_value is not None: 
            return raw_value
        else: 
            return ''

class TaskTool(NBTool):
    """Tool wrapper for the authentication widget"""

    def __init__(self, server_name, tool):
        NBTool.__init__(self)
        self.origin = server_name
        self.id = tool.wrapped['id']
        self.name = tool.wrapped['name']
        self.description = tool.wrapped['description']
        self.load = lambda: GalaxyTaskWidget(tool)
