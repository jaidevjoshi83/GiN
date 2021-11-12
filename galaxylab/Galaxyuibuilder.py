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

    # Declare the Traitlet values for the widget
    # output_var = Unicode(sync=True)
    # origin = Unicode(sync=True)
    # _parameters = List(sync=True)
    # parameter_groups = List(sync=True)
    # function_import = Unicode(sync=True)  # Deprecated
    register_tool = Bool(True, sync=True)
    collapse = Bool(sync=True)
    # events = Dict(sync=True)
    # buttons = Dict(sync=True)
    # display_header = Bool(True, sync=True)
    # display_footer = Bool(True, sync=True)
    run_label = Unicode('Run', sync=True)
    # busy = Bool(False, sync=True)
    GalInstance = Dict(sync=True)
    # GalInstace = Instance('bioblend.galaxy.objects.galaxy_instance.GalaxyInstance').tag(sync=True)
    inputs =  Dict().tag(sync=True)
    form_output = Dict().tag(sync=True)
    History_IDs = List(['Hello']).tag(sync=True)
    HistoryData = List(['Hello']).tag(sync=True)

    UI =  Dict(sync=True)
    ToolID = Unicode(sync=True)

    def __init__(self, inputs,ToolID, History_IDs, HistoryData, GalInstance,   **kwargs):
        # Apply defaults based on function docstring/annotations

        self._apply_defaults()
        self.inputs = inputs
        self.GalInstance =  GalInstance
        self.History_IDs = History_IDs
        self.ToolID = ToolID
        self.HistoryData = HistoryData

        BaseWidget.__init__(self, **kwargs)

        # dir(self)
        # self.on_displayed(lambda widget: display(GalaxyJobWidget()))

    def _apply_defaults(self, function_or_method=None):
        # Set the name based on the function name
        self.name = 'Basic Plot' #function_or_method.__qualname__
        self.id = 'BASICID' #function_or_method.__qualname__

        # Set the description based on the docstring
        self.description = "Basic Plotting"

        # Set the origin based on the package name or "Notebook"
        # self.origin = 'Notebook' if function_or_method.__module__ == '__main__' else function_or_method.__module__

        # register_tool and collapse are True by default
        self.register_tool = True
        self.collapse = False

