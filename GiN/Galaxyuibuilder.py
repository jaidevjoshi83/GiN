from traitlets import Unicode, List, Bool, Dict
from ._frontend import module_name, module_version
from nbtools.basewidget import BaseWidget
from nbtools.tool_manager import  NBTool
from .util import GALAXY_SERVER_NAME_BY_URL


class GalaxyUIBuilder(BaseWidget, NBTool):
    """
    Widget used to render Python output in a UI
    """

    _model_name = Unicode("GalaxyUIBuilderModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    _view_name = Unicode("GalaxyUIBuilderView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    register_tool = Bool(True, sync=True)
    collapse = Bool(sync=True)
    run_label = Unicode("Run", sync=True)
    inputs = Dict().tag(sync=True)
    form_output = Dict().tag(sync=True)
    history_ids = List([]).tag(sync=True)
    history_data = List([]).tag(sync=True)
    origin = Unicode("", sync=True)
    description = Unicode("", sync=True)
    buttons = Dict(sync=True)

    UI = Dict(sync=True)
    galaxy_tool_id = Unicode(sync=True)

    upload_callback = None
    display_header = None
    
    parameters = None

    def __init__(
        self, galaxy_tool_id=None, history_ids=None, description=None, inputs={}, history_data=[], origin='', **kwargs
    ):

        self._apply_defaults()
        self.inputs = inputs
        if history_ids:
            self.history_ids = history_ids
        if galaxy_tool_id:
            self.galaxy_tool_id = str(galaxy_tool_id)
        self.history_data = history_data
        self.origin = origin
        self.description = description
        
        BaseWidget.__init__(self, **kwargs)

    def _apply_defaults(self, function_or_method=None):
        # Set the name based on the function name

        # self.name = f"{self.name} ({GALAXY_SERVER_NAME_BY_URL.get(self.origin, self.origin)})"
        self.name = f"{self.name} ({GALAXY_SERVER_NAME_BY_URL.get(self.origin, self.origin)})"
        self.id = "galaxy_authentication"  # function_or_method.__qualname__
        # Set the description based on the docstring

        # self.description = self.description
        # Set the origin based on the package name or "Notebook"
        # self.origin = 'Notebook' if function_or_method.__module__ == '__main__' else function_or_method.__module__
        # register_tool and collapse are True by default
        self.register_tool = True
        self.collapse = False

    @staticmethod
    def _deprecation_warnings(kwargs):
        if 'function_import' in kwargs:
            warnings.warn(DeprecationWarning('UI Builder specifies function_import, which is deprecated'))

