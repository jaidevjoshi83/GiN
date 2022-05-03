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
import bioblend.galaxy.objects as hi
import json5
import logging
import pickle
import json
import IPython.display
from ipywidgets import DOMWidget
from urllib.error import HTTPError
from time import sleep
from ipywidgets import interactive
import io
import requests
from urllib.request import urlopen

try:
    from genepattern import authwidget
except:
    print('need to be fixed...!')

from gp import GPTask

from os.path import exists
import glob


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

        return IPython.display.JSON(showJob)

    def get_data_type_and_genomes(GalInstance=None):

        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)

        data_types = gi.gi.datatypes.get_datatypes()
        genomes = gi.gi.genomes.get_genomes()
        datatypes_genomes = {'datatypes': data_types, 'genomes': genomes}

        return IPython.display.JSON(datatypes_genomes)


    def upload_dataset(file_path, upload_method, datatype, genome, GalInstance=None,  HistoryID=None):

        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        history = gi.gi.histories.show_history(history_id=HistoryID)
        a = hi.History(history, gi=gi)

        if (upload_method  ==  'text'):
           job = gi.gi.tools.put_url(content=file_path, history_id=HistoryID)

        elif (upload_method  ==  'textarea'):
            job = gi.gi.tools.put_url(content=file_path, history_id=HistoryID)

        return IPython.display.JSON(job)

        

    def TestOut(GalInstance=None, JobID=None):
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        status = gi.jobs.gi.jobs.show_job(JobID,full_details=True)
        return IPython.display.JSON(status)

    def OutPutData(GalInstance=None, JobID=None):
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        showJob = gi.jobs.gi.jobs.show_job(JobID,full_details=True)

        DataList = []

        for i in showJob['outputs'].keys():
            DataList.append(gi.gi.datasets.gi.datasets.show_dataset(dataset_id=showJob['outputs'][i]['id'],hda_ldda=showJob['outputs'][i]['src']))

        return IPython.display.JSON(DataList)

    def RefinedInputs(inputs, gi):
    
        for i in inputs.keys():
            if type(inputs[i]) == dict:
                if list(inputs[i].keys())[0] == 'values':
                    new_values = []
                    for j in inputs[i]['values']:
                        print(j)
                        # Dataset = gi.gi.datasets.gi.datasets.show_dataset(dataset_id=j)
                        # new_values.append({'src':Dataset['hda_ldda'],'id':Dataset['id']})
                        new_values.append(j)
                    inputs[i]['values'] = new_values
        return inputs


    def UpdateForm( GalInstance=None, Tool_inputs=None, toolID=None, HistoryID=None, Python_side=False, InputDataParam=False):

        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)

        if (Tool_inputs != None) and (toolID != None):

            NewInputs = GalaxyTaskWidget.RefinedInputs(Tool_inputs, gi)

            try:
                inputs = gi.gi.tools.gi.tools.build(tool_id=toolID, inputs=Tool_inputs, history_id=HistoryID)
            except:
                pass

            if InputDataParam == False:
                return IPython.display.JSON(data=inputs)
            else:
                return IPython.display.JSON(GalaxyTaskWidget.RetrivParm(inputs['inputs']))

        elif (Tool_inputs == None) and (toolID != None):

            inputs = gi.gi.tools.gi.tools.build(tool_id=toolID, history_id=HistoryID)
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
    
    def delete_dataset(GalInstance=None, history_id=None, dataset_id=None):
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        show_dataset = gi.gi.histories.gi.histories.delete_dataset(history_id=history_id, dataset_id=dataset_id, purge=True)

    def delete_dataset_collection(GalInstance=None, history_id=None, dataset_collection_id=None):
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        show_dataset = gi.gi.histories.gi.histories.delete_dataset_collection(history_id=history_id, dataset_collection_id=dataset_collection_id, purge=True)

    def show_dataset_collection(GalInstance=None, dataset_id=None):        
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        show_dataset = gi.gi.dataset_collections.show_dataset_collection(dataset_collection_id=dataset_id)
        return IPython.display.JSON(show_dataset)

    def read_datafiles_files(data_url, ext):

        if ext == 'csv' or ext == 'tabular' or  ext == 'txt' :
            s=requests.get(data_url).content
            dataframe = pd.read_csv(io.StringIO(s.decode('utf-8')))
            return dataframe

        elif ext == 'png':
            im = Image.open(requests.get(data_url, stream=True).raw)
            return im

        elif ext == 'fasta' or ext == 'bed':
            response = urlopen(data_url)
            fasta = response.read().decode("utf-8", "ignore")
            return fasta

    def download_file_to_jupyter_server( GalInstance=None, data_type='dataset', collection_id=None, ext='zip', file_name=None, dir='galaxy_data'):

        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        galaxy_data = os.path.join(os.getcwd(), dir)

        if not os.path.exists(galaxy_data):
            os.mkdir(galaxy_data)

        if data_type == 'collection':
            file_path = os.path.join(galaxy_data, file_name)+'.'+ext            
            gi.gi.dataset_collections.download_dataset_collection(dataset_collection_id=collection_id, file_path=file_path)
        else:
            gi.gi.datasets.download_dataset(dataset_id=collection_id, file_path=galaxy_data)


    def send_data_to_gp_server( file_name, tool_id, dataset_id,  GInstance, ext):

        temp_dir = os.path.join(os.getcwd(), 'temp')

        if not os.path.exists(temp_dir):
            os.mkdir(temp_dir)

        for f in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, f))

        GalaxyTaskWidget.download_file_to_jupyter_server(GalInstance= GInstance,  collection_id=dataset_id, dir='temp')
        file_name = glob.glob(os.path.join(temp_dir, '*.*' ))
        new_file = os.path.join("/".join(file_name[0].split('/')[:len(file_name[0].split('/'))-1]), 'data.'+ext)
        os.rename(file_name[0], new_file)
        ####################
        task = GPTask(authwidget.session.sessions[0], tool_id)  
        uri = task.server_data.upload_file( new_file.split('/')[len(new_file.split('/'))-1], new_file)
        #####################
        return IPython.display.JSON({'uri':uri.uri})

    def return_job_status( GalInstance=None, job_id=None):

       gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
       job_state = gi.gi.jobs.show_job(job_id=job_id, full_details=True)

       return IPython.display.JSON(job_state)

    def return_job_state( GalInstance=None, job_id=None):
        gi = GalaxyInstance(GalInstance['URL'], email=GalInstance['email_ID'], api_key=GalInstance['API_key'], verify=True)
        job_state = gi.gi.jobs.get_state(job_id=job_id)
        return IPython.display.JSON({'job_state':job_state})

    def handle_error_task(self, error_message, name='Galaxy Module', **kwargs):
        """Display an error message if the task is None"""
        UIBuilder.__init__(self, lambda: None, color=self.default_color, **kwargs)

        self.name = name
        self.display_header = False
        self.display_footer = False
        self.error = error_message

    def __init__(self, tool=None, **kwargs):


        upload_tool_spec = {}

        """Initialize the task widget"""

        if (tool == None):
            pass
        else:

            self.tool = tool

            self.GalInstance= { 
                                "API_key":  self.tool['gi']._key,
                                "email_ID": self.tool['gi'].users.get_current_user()['email'],
                                "URL":      self.tool['gi'].base_url,
                                "tool_ID": self.tool['id'],
                                "tool_name": self.tool['name'],
                                "tool_description": self.tool['description'],
                            }

            History_IDs = self.tool['gi'].histories.gi.histories.get_histories()

            if self.tool['id'] == 'galaxylab_data_upload_tool':
                inputs = {'id':'galaxylab_data_upload_tool', 'inputs': [{'model_class': 'DataToolParameter', 'name': 'input1',  'type': 'data_upload'}], 'help': '<p>Upload data tool</p>\n<p>This tool uploads data to the selected history of the Galaxy server. User can select file from the local machine, data can be fetch directly from the URL or can be generated by available UI and uploaded to the server.</p>\n'} 
            # elif  self.tool['id'] == 'cross_upload_tool':
            #     inputs = {'id':'cross_upload_tool', 'inputs': [{'model_class': 'DataToolParameter', 'name': 'input1',  'type': 'cross_upload'}], 'help': '<p>Cross Upload Tool</p>\n<p>This tool uploads data to the selected history of the Galaxy server. User can select file from the local machine, data can be fetch directly from the URL or can be generated by available UI and uploaded to the server.</p>\n'} 
            else:
                inputs = self.tool['gi'].tools.gi.tools.build(tool_id=tool['id'], history_id=History_IDs[0]['id'] )

            HistoryData = GalaxyTaskWidget.UpdateForm(GalInstance=self.GalInstance, HistoryID=History_IDs[0]['id'], Python_side=True)    

            GalaxyUIBuilder.__init__(self, inputs=inputs,ToolID=self.tool['id'], History_IDs=History_IDs, HistoryData=HistoryData, GalInstance=self.GalInstance,
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
        self.id = tool['id']
        self.name = tool['name']
        self.description = tool['description']
        self.load = lambda: GalaxyTaskWidget(tool)