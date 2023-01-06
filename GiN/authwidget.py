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

import IPython
import IPython.display
  



class GalaxyAuthWidget(GalaxyUIBuilder):
    """A widget for authenticating with a Galaxy server"""

    default_color = DEFAULT_COLOR
    default_logo = DEFAULT_LOGO



    def __init__(self, session=None, **kwargs):
        """Initialize the authentication widget"""

        GalaxyUIBuilder.__init__(
            self,
            name='login',
            run_label='Login Galaxy',
            description='Login to Galaxy instance by credenital or API Key',
            display_header=False,
            color=self.default_color,
            logo=self.default_logo,
            collapsed=False,
            gal_instance={'tool_name': 'login', 'url': ''},
            **kwargs
        )

        self.session = session
        # Assign the session object, lazily creating one if needed

        if self.validate_credentials(session):
            self.register_session()  # Register the session with the SessionList
            self.register_modules()  # Register the modules with the ToolManager
            self.system_message()  # Display the system message
            self.trigger_login()  # Trigger login callbacks of job and task widgets


    def login(self, server, email, password):
        """Login to the Galaxy server"""

        t = [
            {
                "id": server+'/GiN_data_upload_tool',
                "description": "Upload data files to galaxy server",
                "name": "Upload Data",
            }
        ]

        try:
            self.session = GalaxyInstance(server, email=email, password=password)
        except:
            return IPython.display.JSON({"error": "authentication error"})

        self.session._notebook_url = server
        self.session._notebook_email = email
        self.session._notebook_password = password
        # Validate the provided credentials
       
        self.replace_widget()

        def register_modules_callback():
            for i in t:
                if self.validate_credentials(self.session):
                    i["gi"] = self.session.tools.gi
                    tool1 = TaskTool("+", i)
                    ToolManager.instance().register(tool1)

        # Register tools in their own thread so as not to block the kernel

        registration_thread = Thread(target=register_modules_callback)
        registration_thread.start()


        # GalaxyUIBuilder.__init__(
        #     self,
        #     name='login as jaidev',
        #     run_label='Login Galaxy',
        #     description='Login to Galaxy instance by credenital or API Key',
        #     display_header=False,
        #     color=self.default_color,
        #     logo=self.default_logo,
        #     collapsed=True,
        #     gal_instance={'tool_name': 'login', 'url': ''},
        #     **kwargs
        # )

        self.collapse = True

        # except HTTPError:
        #     self.error = "Invalid username or password. Please try again."
        # except BaseException as e:
        #     self.error = str(e)

        return IPython.display.JSON({"error": "Successful"})

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
        )

    def register_modules(self):

        # ToolManager.tool = New_tool
       
        """Get the list available modules (currently only tools) and register widgets for them with the tool manager"""
        url = self.session._notebook_url

        # def register_modules_callback():
        for section in self.session.tools.gi.tools.get_tool_panel():
            if section["model_class"] == "ToolSection":
                for t in section["elems"]:
                    # t['id']  = t['id']+':'+str(uuid.uuid1())
                    # try:
                    t["gi"] = self.session.tools.gi

                    if t['model_class'] == 'Tool':
                        tool = TaskTool(server_name(url), t)
                        ToolManager.instance().register(tool)
                        print("ok")
            
            
        # registration_thread = Thread(target=register_modules_callback)
        # registration_thread.start()
        return
       

    def system_message(self):
        self.info = "Successfully logged into Galaxy"

    def trigger_login(self):
        """Dispatch a login event after authentication"""
        # Trigger login callbacks of job and task widgets
        return

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

# class AuthenticationTool(NBTool):
#     """Tool wrapper for the authentication widget"""

#     origin = "+"
#     id = "galaxy_authentication"
#     name = "Galaxy Login"
#     description = "Log into a Galaxy server"
#     load = lambda x: GalaxyAuthWidget()



class AuthenticationTool(NBTool):

    """Tool wrapper for the authentication widget"""

    def __init__(self):
        
        NBTool.__init__(self)
        self.origin = '+'
        self.id = "galaxy_authentication"
        self.name = "Galaxy Login"
        self.description = "Log into a Galaxy server"
        self.load = lambda: GalaxyAuthWidget()


# ToolManager.tool = New_tool
ToolManager.create_placeholder_widget = new_create_placeholder_widget


# Register the authentication widget
ToolManager.instance().register(AuthenticationTool())