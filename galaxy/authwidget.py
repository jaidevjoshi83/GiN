import bioblend
import nbtools
from bioblend.galaxy.objects import client, GalaxyInstance
import gp
from IPython.display import display
from nbtools import UIBuilder, ToolManager, NBTool, EventManager
from .sessions import session
from .shim import login, system_message
from .taskwidget import TaskTool
from .util import DEFAULT_COLOR, DEFAULT_LOGO
from bioblend import galaxy


GALAXY_SERVERS = {
    'Galaxy Main': 'https://usegalaxy.org',
    'Galaxy Local': 'http://localhost:8080',
    'Galaxy Jay Local': 'http://192.168.1.139:8080',
}

REGISTER_EVENT = """
    const target = event.target;
    const widget = target.closest('.nbtools') || target;
    const server_input = widget.querySelector('input[type=text]');
    if (server_input) window.open(server_input.value + '/login#register');
    else console.warn('Cannot obtain Galaxy Server URL');"""

class GPAuthWidget(UIBuilder):
    """A widget for authenticating with a GenePattern server"""
    #default_color = 'rgba(10, 45, 105, 0.80)'
    default_color = DEFAULT_COLOR
    default_logo =  DEFAULT_LOGO

    login_spec = {  # The display values for building the login UI
        'name': 'Login',
        'collapse': False,
        'display_header': False,
        'color': default_color,
        'logo': default_logo,
        'run_label': 'Log into Galaxy',
        'buttons': {
            'Register an Account': REGISTER_EVENT
        },
        'parameters': {
            'server': {
                'name': 'Galaxy Server',
                'type': 'choice',
                'combo': True,
                'sendto': False,
                'default': GALAXY_SERVERS['Galaxy Main'],
                'choices': GALAXY_SERVERS
            },
            'email': {
                'name': 'Email',
                'sendto': False,
            },
            'password': {
                'name': 'Password',
                'type': 'password',
                'sendto': False,
            }
        }
    }

    def __init__(self, session=None, **kwargs):
        """Initialize the authentication widget"""

       # print (session)
        if session is None: 
            self.session = galaxy.GalaxyInstance("", email="", password="")
        else: 
            self.session = session

        # Assign the session object, lazily creating one if needed
        if self.validate_credentials(session):
            self.register_session()
            self.register_modules()     # Register the modules with the ToolManager
            self.system_message()       # Display the system message

            # Display the widget with the system message and no form
            UIBuilder.__init__(self, lambda: None, name=self.session.url, display_header=False, display_footer=False,
                               color=self.default_color, logo=self.default_logo, collapsed=True, **kwargs)

        # If not, prompt the user to login
        else:
            # Apply the display spec
            for key, value in self.login_spec.items(): kwargs[key] = value

            # Call the superclass constructor with the spec
            UIBuilder.__init__(self, self.login, **kwargs)

    def login(self, server, email, password):

        """Login to the GenePattern server"""
        
        self.session.url = server
        self.session.email = email
        self.session.password = password

        # Validate the provided credentials
        if self.validate_credentials(self.session):
            self.replace_widget()


    def validate_credentials(self, session):
        """Validate the provided credentials"""
        # TODO: Is there a bioblend call to verify the user's login credentials? If so, add it here
        return session is not None

    def replace_widget(self):
        """Replace the unauthenticated widget with the authenticated widget"""
        self.form.children[2].value = ''            # Blank password so it doesn't get serialized
        display(GPAuthWidget(self.session))     # Display the authenticated widget
        self.close()   

    def register_session(self):
        """Register the validated credentials with the SessionList"""
        self.session = session.register(self.session.url, self.session.email, self.session.password)                          # Close the unauthenticated widget

    def register_modules(self):

        session = GalaxyInstance(self.session.url, email=self.session.email, password=self.session.password)

        a = bioblend.galaxy.objects.client.ObjToolClient(session) 

        for tool in a.list():
            tools = a.get(id_=tool.wrapped['id'],  io_details=True)
            t = TaskTool(self.session.url, tools)
            ToolManager.instance().register(t)
        """Get the list available modules and register widgets for them with the tool manager"""
        # TODO: Register galaxy tools with the tool manager - galaxy.tools.get_tools()
   
    def system_message(self):
        self.info = "Successfully logged into Galaxy"


class AuthenticationTool(NBTool):
    """Tool wrapper for the authentication widget"""
    origin = '+'
    id = 'galaxy_authentication'
    name = 'Galaxy Login'
    description = 'Log into a Galaxy server'
    load = lambda x: GPAuthWidget()


# Register the authentication widget
ToolManager.instance().register(AuthenticationTool())