from asyncio import constants
from tkinter import Y
from bioblend.galaxy.objects import GalaxyInstance
from .display import display
from nbtools import UIBuilder, ToolManager, NBTool, EventManager
from threading import Thread
from .sessions import session
# from .shim import login, system_message
from .taskwidget import TaskTool, GalaxyTaskWidget
from .util import DEFAULT_COLOR, DEFAULT_LOGO, GALAXY_SERVERS
from urllib.error import HTTPError
from .Galaxyuibuilder import GalaxyUIBuilder
from ipywidgets import Output
from nbtools.uioutput import UIOutput
from nbtools.event_manager import EventManager
import IPython
import IPython.display

class GalaxyAuthWidget(GalaxyUIBuilder):
    """A widget for authenticating with a Galaxy server"""

    default_color = DEFAULT_COLOR
    default_logo = DEFAULT_LOGO
    new_session=None

    def __init__(self, session=None, **kwargs):
        """Initialize the authentication widget"""

        self.session = session

        GalaxyUIBuilder.__init__(
            self,
            name='login',
            run_label='Login',
            description='Login to Galaxy instance by credentials or API Key',
            # display_header=False,
            color=self.default_color,
            logo=self.default_logo,
            collapsed=False,
            buttons={
                    'Register an Account': '',
            },
            **kwargs
        )


## Registering tools in treads, Login fast but tool loading slow. 

    def login(self, credentials):


        """Login to the Galaxy server"""

        tools = []

        tool_list =  {'tools':[]}
    
        if credentials['email']:
            try:
                self.session = GalaxyInstance(credentials['server'], email=credentials['email'], password=credentials['password'])
                self.session._notebook_email = credentials['email']
            except:
                # tool_list['state'] = 'error'
                return IPython.display.JSON({'state': 'error'})
        else:
            try:
                self.session = GalaxyInstance(credentials['server'],  api_key=credentials['api_key'], verify=True)
                self.session._notebook_email = self.session.gi.users.get_current_user()['email']
            except:
                # tool_list['state'] = 'error'
                return IPython.display.JSON({'state': 'error'})

        self.session._notebook_url = credentials['server']
        self.session._notebook_password = credentials['password']
        self.session._notebook_key = credentials['api_key']
        self.register_session()

        tool_list['url']  = self.session._notebook_url
        tool_list['email'] = self.session._notebook_email   
        
    
        def register_modules_callback():
            for section in self.session.tools.gi.tools.get_tool_panel():
                if section["model_class"] == "ToolSection":
                    for t in section["elems"]:
                        try:
                            tool={'id':None, 'description':None, 'name':None}
                            if t['model_class'] == 'Tool':
                            
                                tool['id'] = t['id']
                                tool['description'] = t['description']
                                tool['name'] = t['name']+" ("+t['version']+")"
                                tool['origin'] = self.session._notebook_url
                                tool['email'] = self.session._notebook_email
                                tool = TaskTool(tool['origin'], tool)
                                ToolManager.instance().register(tool)
                                # tool_list['tools'].append(tool)
                        except:
                            pass

        # Run_Threads(all_tools, 2)
        
        t = {"id": 'GiN_data_upload_tool',  "description": "Upload data files to galaxy server", "name": "Upload Data", 'origin': self.session._notebook_url, 'inputs': [{'type': 'data_upload'}]}
        t = TaskTool('+', t )
        ToolManager.instance().register(t)
         
        registration_thread = Thread(target=register_modules_callback)
        registration_thread.start()
        # registration_thread.join()

        return IPython.display.JSON({'state':'success', 'tool_list':''}) 


    def has_credentials(self):
        """Test whether the session object is instantiated and whether an email and password have been provided"""
        if type(self.session) is not GalaxyInstance:
            return False  # Test type
        if not self.session._notebook_url:
            return False  # Test server url
        # if not self.session._notebook_email:
        #     print("error", 'email')
        #     return False  # Test email
        if not self.session._notebook_password:
            return False  # Test password
        return True

    def validate_credentials(self, session):
        """Validate the provided credentials"""
        # TODO: Is there a bioblend call to verify the user's login credentials? If so, add it here
        try:
            if session is not None and session.gi.key:
                return True
        except:
            pass
        # except HTTPError:
        #     self.error = 'Invalid username or password. Please try again.'
        #     return False
        # except BaseException as e:
        #     self.error = str(e)
        return False

    def replace_widget(self):
        """Replace the unauthenticated widget with the authenticated widget"""
        # self.form.children[1].value = "" 
        # self.form.children[2].value = ""  # Blank password so it doesn't get serialized
        display(GalaxyAuthWidget(session=self.session))  # Display the authenticated widget
        self.close()  # Close the unauthenticated widget

    def register_session(self):
        """Register the validated credentials with the SessionList"""

        self.session = session.register(
            self.session._notebook_url,
            self.session._notebook_email,
            self.session._notebook_password,
            self.session._notebook_key, 
        )

    def system_message(self):
        self.info = "Successfully logged into Galaxy"

    def trigger_login(self):
        """Dispatch a login event after authentication"""
        # Trigger login callbacks of job and task widgets
        # return

        EventManager.instance().dispatch("galaxy.login", self.session)

def server_name(search_url):
    """Search the GALAXY_SERVERS dict for the server with the matching URL"""
    for name, url in GALAXY_SERVERS.items():
        if url == search_url:
            return name
    return search_url


class AuthenticationTool(NBTool):
    """Tool wrapper for the authentication widget"""

    origin = "+"
    id = "galaxy_authentication"
    name = "Galaxy Login"
    description = "Log into a Galaxy server"
    load = lambda x: GalaxyAuthWidget()


# preventing  "jupyter nbextension install", imports need to be fixed 
try:
    ToolManager.instance().register(AuthenticationTool())
except:
    pass