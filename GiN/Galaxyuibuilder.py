import inspect
import pickle
import functools
import warnings

from IPython.core.display import display
from traitlets import Unicode, List, Bool, Dict, Instance, Bytes
from ipywidgets import widget_serialization, Output
from ._frontend import module_name, module_version
from nbtools.form import InteractiveForm
from nbtools.basewidget import BaseWidget
from nbtools.tool_manager import ToolManager, NBTool
from .jobwidget import GalaxyJobWidget
from ipywidgets import interactive

class GalaxyUIBuilder(BaseWidget, NBTool):
    """
    Widget used to render Python output in a UI
    """
    _model_name = Unicode('GalaxyUIBuilderModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    _view_name = Unicode('GalaxyUIBuilderView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    register_tool = Bool(True, sync=True)
    collapse = Bool(sync=True)
    run_label = Unicode('Run', sync=True)
    GalInstance = Dict(sync=True)
    inputs =  Dict().tag(sync=True)
    form_output = Dict().tag(sync=True)
    History_IDs = List(['Hello']).tag(sync=True)
    HistoryData = List(['Hello']).tag(sync=True)

    UI =  Dict(sync=True)
    ToolID = Unicode(sync=True)

    def __init__(self, ToolID, History_IDs, inputs={},  GalInstance={},  HistoryData=[], **kwargs):

        self._apply_defaults()
        self.inputs = inputs
        self.GalInstance =  GalInstance
        self.History_IDs = History_IDs
        self.ToolID = ToolID
        self.HistoryData = HistoryData

        BaseWidget.__init__(self, **kwargs)


    def _apply_defaults(self, function_or_method=None):
        # Set the name based on the function name

        if self.GalInstance == {}:
            self.name = 'Data Upload Tool' #function_or_method.__qualname__
            self.id = 'GiN_Upload_Data'
            self.description = 'data upload tool'
        else:
            self.name = self.GalInstance['tool_name']+" ("+self.GalInstance['URL']+")" 
            self.id = self.GalInstance['tool_ID'] #function_or_method.__qualname__

            # Set the description based on the docstring
            self.description = self.GalInstance['tool_description']

        # Set the origin based on the package name or "Notebook"
        # self.origin = 'Notebook' if function_or_method.__module__ == '__main__' else function_or_method.__module__

        # register_tool and collapse are True by default
        self.register_tool = True
        self.collapse = False

