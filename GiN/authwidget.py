from asyncio import constants
from tkinter import Y
from bioblend.galaxy.objects import GalaxyInstance
from .display import display
from nbtools import UIBuilder, ToolManager, NBTool, EventManager
from threading import Thread
from .sessions import session
# from .shim import login, system_message
from .taskwidget import TaskTool
from .util import DEFAULT_COLOR, DEFAULT_LOGO, GALAXY_SERVERS
from urllib.error import HTTPError
from .Galaxyuibuilder import GalaxyUIBuilder
from ipywidgets import Output
from nbtools.uioutput import UIOutput
from nbtools.event_manager import EventManager
import GiN
import uuid
import json

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
            run_label='Login into Galaxy',
            description='Login to Galaxy instance by credenital or API Key',
            display_header=False,
            color=self.default_color,
            logo=self.default_logo,
            collapsed=False,
            **kwargs
        )

    def login(self, server, password=None, api_key=None, email=None):
        """Login to the Galaxy server"""

        t = [
            {
                "id": server+'/GiN_data_upload_tool',
                "description": "Upload data files to galaxy server",
                "name": "Upload Data",
            }
        ]

        tool_list =  {'tools':[]}
    
        if email:
            try:
                self.session = GalaxyInstance(server, email=email, password=password)
                self.session._notebook_email = email
            except:
                tool_list['error'] = 'true'
                return IPython.display.JSON(tool_list['error'])
        else:
            try:
                self.session = GalaxyInstance(server,  api_key=api_key, verify=True)
                self.session._notebook_email = self.session.gi.users.get_current_user()['email']
            except:
                tool_list['error'] = 'true'
                return IPython.display.JSON({"error": 'true'})

        self.session._notebook_url = server
        self.session._notebook_password = password
        self.session._notebook_key = api_key

        # Validate the provided credentials

        self.register_session()

        tool_list['url']  = self.session._notebook_url
        tool_list['email'] = self.session._notebook_email        

        for section in self.session.tools.gi.tools.get_tool_panel():
            if section["model_class"] == "ToolSection":
                for t in section["elems"]:
                    tool={'id':None, 'description':None, 'name':None}
                    if t['model_class'] == 'Tool':
                    
                        tool['id'] = t['id']
                        tool['description'] = t['description']
                        tool['name'] = t['name']
                        tool['origin'] = self.session._notebook_url
                        tool['email'] = self.session._notebook_email
                        tool_list['tools'].append(tool)

        return IPython.display.JSON(tool_list)

    def RegisterMod(self, tool):
        # aDict = json.loads(tool)
        # tool1 = tool1
        # def register_modules_callback():
        tool = TaskTool(self.session._notebook_url, tool)
        ToolManager.instance().register(tool)
        # registration_thread = Thread(target=register_modules_callback)
        # registration_thread.start()

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


def new_create_placeholder_widget( origin, id, message=None):

    output = Output()  # Output widget
    
    if message is not None:
        error_msg = message
        name = "Tool origin error"
    else:
        error_msg = f"Cannot find tool: {origin} | {id}"
        name = "Cannot find tool"

    placeholder = UIOutput(
        name= name, 
        error=error_msg,
        color= DEFAULT_COLOR,
        logo= DEFAULT_LOGO,

    )  # Placeholder widget
    output.append_display_data(placeholder)

    # Callback to see if the placeholder needs replaced after a new widget is registered
    def check_registration_callback(data):
        if (
            "origin" in data
            and "id" in data
            and data["origin"] == origin
            and data["id"] == id
        ):
            placeholder.close()
            with output:
                display(self.tool(id=id, origin=origin))

    # Register the callback with the event manager
    EventManager.instance().register(
        "nbtools.register", check_registration_callback
    )
    return output

class AuthenticationTool(NBTool):
    """Tool wrapper for the authentication widget"""

    origin = "+"
    id = "galaxy_authentication"
    name = "Galaxy Login"
    description = "Log into a Galaxy server"
    load = lambda x: GalaxyAuthWidget()

# Register the authentication widget
ToolManager.instance().register(AuthenticationTool())