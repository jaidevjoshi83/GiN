from nbtools import ToolManager
from nbtools import NBTool
from .authwidget import GalaxyAuthWidget

class GalaxyToolManager(ToolManager):

    # COMM_NAME = 'gin_comm' 
    _instance = None
    
    @staticmethod
    def instance():
        if GalaxyToolManager._instance is None:
            GalaxyToolManager._instance = GalaxyToolManager()
        return GalaxyToolManager._instance

    def __init__(self):
        super(GalaxyToolManager, self).__init__()
        self.tools = {}  

    @classmethod
    def tool(cls, id, origin='Notebook'):
        """
        Return reference to tool widget given the id and origin
        """

        a = AuthenticationTool()

        return a 

    
        # if cls.exists(id, origin):

            
        #     return cls.instance().tools[origin][id]
        # else:
        #     display(cls.create_placeholder_widget(origin, id))


def tool(id, origin, **kwargs):
    nbtool = GalaxyToolManager.tool(id=id, origin=origin)
    if nbtool:  # Call load() passing kwargs only if kwargs are accepted
        try: return nbtool.load(**kwargs)
        except TypeError: return nbtool.load()



class AuthenticationTool(NBTool):
    """Tool wrapper for the authentication widget"""

    origin = "+"
    id = "galaxy_authentication"
    name = "Galaxy Login"
    description = "Log into a Galaxy server"
    load = lambda x: GalaxyAuthWidget()