import inspect
import os
import tempfile
from .display import display
from .jobwidget import GalaxyJobWidget
from nbtools import NBTool,  python_safe, EventManager
from .Galaxyuibuilder import GalaxyUIBuilder
from .shim import  get_kinds
from .util import DEFAULT_COLOR, DEFAULT_LOGO


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

        print('jai')

        def submit_job(**kwargs):

            self.job = gi.tools.run_tool(history_id='3434343434', tool_id='sdfsdffsf', tool_inputs={''})
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
            display(GalaxyJobWidget(self.job, gi))
            ###########################Job run ######################### 

        return submit_job
    

    def generate_upload_callback(self):

        def galaxy_upload_callback(values):
            gi = self.tool.gi.gi
            for k in values:
                print(values)
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


    def __init__(self, tool=None, **kwargs):

        """Initialize the task widget"""


        self.tool = tool

        self.SubmitJob = self.create_function_wrapper(self.tool)

        GalaxyUIBuilder.__init__(self, self.tool.wrapped['inputs'], 
                           color=self.default_color,
                           logo=self.default_logo,
                            **kwargs)

class TaskTool(NBTool):
    """Tool wrapper for the authentication widget"""

    def __init__(self, server_name, tool):
        NBTool.__init__(self)
        self.origin = server_name
        self.id = tool.wrapped['id']
        self.name = tool.wrapped['name']
        self.description = tool.wrapped['description']
        self.load = lambda: GalaxyTaskWidget(tool)