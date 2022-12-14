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
    gal_instance = Dict(sync=True)
    inputs = Dict().tag(sync=True)
    form_output = Dict().tag(sync=True)
    history_ids = List([]).tag(sync=True)
    history_data = List([]).tag(sync=True)


    UI = Dict(sync=True)
    galaxy_tool_id = Unicode(sync=True)

    def __init__(
        self, galaxy_tool_id=None, history_ids=None, inputs={}, gal_instance={}, history_data=[], **kwargs
    ):

        self._apply_defaults()
        self.inputs = inputs
        self.gal_instance = gal_instance
        self.history_ids = history_ids
        self.galaxy_tool_id = galaxy_tool_id
        self.history_data = history_data
        
        BaseWidget.__init__(self, **kwargs)

    def _apply_defaults(self, function_or_method=None):
        # Set the name based on the function name

        if self.gal_instance == {}:
            self.name = "Data Upload Tool"  # function_or_method.__qualname__
            self.id = "GiN_Upload_Data"
            self.description = "data upload tool"
        else:
            self.name = f"{self.gal_instance['tool_name']} ({GALAXY_SERVER_NAME_BY_URL.get(self.gal_instance['url'], self.gal_instance['url'])})"
            self.id = self.gal_instance["tool_id"]  # function_or_method.__qualname__
            # Set the description based on the docstring
            self.description = self.gal_instance["tool_description"]
        # Set the origin based on the package name or "Notebook"
        # self.origin = 'Notebook' if function_or_method.__module__ == '__main__' else function_or_method.__module__
        # register_tool and collapse are True by default
        self.register_tool = True
        self.collapse = False

