import inspect
import functools
import warnings

from IPython.core.display import display
from traitlets import Unicode, List, Bool, Dict, Instance
from ipywidgets import widget_serialization, Output
from ._frontend import module_name, module_version
from nbtools.form import InteractiveForm
from nbtools.basewidget import BaseWidget
from nbtools.tool_manager import ToolManager, NBTool


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
    output_var = Unicode(sync=True)
    origin = Unicode(sync=True)
    _parameters = List(sync=True)
    parameter_groups = List(sync=True)
    function_import = Unicode(sync=True)  # Deprecated
    register_tool = Bool(True, sync=True)
    collapse = Bool(sync=True)
    events = Dict(sync=True)
    buttons = Dict(sync=True)
    display_header = Bool(True, sync=True)
    display_footer = Bool(True, sync=True)
    run_label = Unicode('Run', sync=True)
    busy = Bool(False, sync=True)
    form = Instance(InteractiveForm, (None, [])).tag(sync=True, **widget_serialization)
    print(form)
    output = Instance(Output, ()).tag(sync=True, **widget_serialization)
    function_or_method = None
    inputs = List(['Hello']).tag(sync=True)
    form_output = Dict(sync=True)

    print('##############')
    print(form_output)
    print('##############')


    def __init__(self, inputs,   **kwargs):

        self._apply_defaults()
        self.inputs = inputs
        BaseWidget.__init__(self, **kwargs)

    def _apply_defaults(self):

        self.register_tool = True
        self.collapse = True





