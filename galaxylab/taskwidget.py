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
from ipywidgets import DOMWidget
from urllib.error import HTTPError
from time import sleep
from ipywidgets import interactive


class GalaxyTaskWidget(GalaxyUIBuilder):
    """A widget for representing the status of a Galaxy job"""
    #default_color = 'rgba(10, 45, 105, 0.80)'
    default_color = DEFAULT_COLOR
    default_logo = DEFAULT_LOGO
    tool = None

    def __init__(self, tool=None, **kwargs):
        self.tool = tool

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

    def submit_job( GalInstance=None, Tool_inputs=None, HistoryID=None):
        import time

        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        tool_inputs  = json5.loads(Tool_inputs)

        NewInputs = GalaxyTaskWidget.RefinedInputs(tool_inputs, gi)
        job = gi.tools.gi.tools.run_tool(history_id=HistoryID, tool_id=GalInstance['tool_ID'], tool_inputs=NewInputs)
        showJob = gi.jobs.gi.jobs.show_job(job['jobs'][0]['id'],full_details=True)
        print('#################showJob################')
        # print(showJob)
        print('#################showJob################')


        return IPython.display.JSON(showJob)

    def TestOut(GalInstance=None, JobID=None):
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        # status = gi.jobs.gi.jobs.get_state(JobID)
        status = gi.jobs.gi.jobs.show_job(JobID,full_details=True)
        return IPython.display.JSON(status)

    def OutPutData(GalInstance=None, JobID=None):
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        showJob = gi.jobs.gi.jobs.show_job(JobID,full_details=True)

        DataList = []

        for i in showJob['outputs'].keys():
            print('#############')
            DataList.append(gi.gi.datasets.gi.datasets.show_dataset(dataset_id=showJob['outputs'][i]['id'],hda_ldda=showJob['outputs'][i]['src']))

        return IPython.display.JSON(DataList)

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


    def UpdateForm( GalInstance=None, Tool_inputs=None, toolID=None, HistoryID=None, Python_side=False, InputDataParam=False):

        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)

        if (Tool_inputs != None) and (toolID != None):

            NewInputs = GalaxyTaskWidget.RefinedInputs(Tool_inputs, gi)
            inputs = gi.gi.tools.gi.tools.build_tool(tool_id=toolID, inputs=NewInputs, history_id=HistoryID)

            if InputDataParam == False:
                return IPython.display.JSON(data=inputs)
            else:
                return IPython.display.JSON(GalaxyTaskWidget.RetrivParm(inputs['inputs']))

        elif (Tool_inputs == None) and (toolID != None):

            inputs = gi.gi.tools.gi.tools.build_tool(tool_id=toolID, history_id=HistoryID)
            return IPython.display.JSON(data=inputs)

        else:
            HistoryData = gi.gi.datasets.gi.datasets.get_datasets(history_id=HistoryID, state='ok', deleted=False,  purged=False, visible=True)

            if Python_side==True:
                return HistoryData
            else:
                return IPython.display.JSON(data=HistoryData)

    def history_data_list( GalInstance=None, HistoryID=None):

        datasets = []
        
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        HistoryData = gi.gi.datasets.gi.datasets.get_datasets(history_id=HistoryID, deleted=False,  purged=False, visible=True)
        # for i in HistoryData:
        #     datasets.append(gi.gi.datasets.gi.datasets.show_dataset(dataset_id=i['id']))

        return IPython.display.JSON(HistoryData)

    def show_data_set(GalInstance=None, dataset_id=None):        
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        show_dataset = gi.gi.datasets.gi.datasets.show_dataset(dataset_id=dataset_id)
        return IPython.display.JSON(show_dataset)

    def handle_error_task(self, error_message, name='Galaxy Module', **kwargs):
        """Display an error message if the task is None"""
        UIBuilder.__init__(self, lambda: None, color=self.default_color, **kwargs)

        self.name = name
        self.display_header = False
        self.display_footer = False
        self.error = error_message

    def __init__(self, tool=None, **kwargs):

        """Initialize the task widget"""

        if (tool == None):
            pass
        else:

            self.tool = tool

            self.GalInstance= { 
                                "API_key":  self.tool.gi.gi._key,
                                "email_ID": self.tool.gi.gi.users.get_current_user()['email'],
                                "URL":      self.tool.gi.gi.base_url,
                                "tool_ID": self.tool.wrapped['id'],
                                "tool_name": self.tool.wrapped['name'],
                                "tool_description": self.tool.wrapped['description'],
                            }

            History_IDs = self.tool.gi.histories.gi.histories.get_histories()
            inputs = self.tool.gi.tools.gi.tools.build_tool(tool_id=tool.wrapped['id'], history_id=History_IDs[0]['id'] )
            HistoryData = GalaxyTaskWidget.UpdateForm(GalInstance=self.GalInstance, HistoryID=History_IDs[0]['id'], Python_side=True)    

            GalaxyUIBuilder.__init__(self, inputs=inputs,ToolID=self.tool.wrapped['id'], History_IDs=History_IDs, HistoryData=HistoryData, GalInstance=self.GalInstance,
                            color=self.default_color,
                            logo=self.default_logo,
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