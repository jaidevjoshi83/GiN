from bioblend.galaxy.objects import GalaxyInstance
from .display import display
from nbtools import UIBuilder, ToolManager, NBTool, EventManager
from .sessions import session
#from .shim import login, system_message
from .taskwidget import TaskTool
from .util import DEFAULT_COLOR, DEFAULT_LOGO


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

class GalaxyAuthWidget(UIBuilder):
    """A widget for authenticating with a Galaxy server"""
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
                'default': GALAXY_SERVERS['Galaxy Local'],
                'choices': GALAXY_SERVERS
            },
            'email': {
                'name': 'Email',
                'sendto': False,
                'default':'jaidev53ster@gmail.com'
            },
            'password': {
                'name': 'Password',
                'type': 'password',
                'sendto': False,
                'default':'12212283.j'
            }
        }
    }

    def __init__(self, session=None, **kwargs):
        """Initialize the authentication widget"""
        self.session = session

        # Assign the session object, lazily creating one if needed
        if self.has_credentials() and self.validate_credentials(session):
            self.register_session()     # Register the session with the SessionList
            self.register_modules()     # Register the modules with the ToolManager
            self.system_message()       # Display the system message
            self.trigger_login()        # Trigger login callbacks of job and task widgets

            # Display the widget with the system message and no form
            UIBuilder.__init__(self, lambda: None, name=server_name(self.session._notebook_url), display_header=False, display_footer=False,
                               color=self.default_color, logo=self.default_logo, collapsed=True, **kwargs)

        # If not, prompt the user to login
        else:
            # Apply the display spec
            for key, value in self.login_spec.items(): kwargs[key] = value

            # Call the superclass constructor with the spec
            UIBuilder.__init__(self, self.login, **kwargs)

    def login(self, server, email, password):
        """Login to the Galaxy server"""
        self.session = GalaxyInstance(server, email=email, password=password)
        self.session._notebook_url = server
        self.session._notebook_email = email
        self.session._notebook_password = password

        # Validate the provided credentials
        if self.validate_credentials(self.session):
            self.replace_widget()

    def has_credentials(self):
        """Test whether the session object is instantiated and whether an email and password have been provided"""
        if type(self.session) is not GalaxyInstance: return False  # Test type
        if not self.session._notebook_url: return False                   # Test server url
        if not self.session._notebook_email: return False              # Test email
        if not self.session._notebook_password: return False              # Test password
        return True

    def validate_credentials(self, session):
        """Validate the provided credentials"""
        # TODO: Is there a bioblend call to verify the user's login credentials? If so, add it here
        try:
            if session is not None and session.gi.key:
                return True
        except HTTPError:
            self.error = 'Invalid username or password. Please try again.'
            return False
        except BaseException as e:
            self.error = str(e)
        return False

    def replace_widget(self):
        """Replace the unauthenticated widget with the authenticated widget"""
        self.form.children[2].value = ''            # Blank password so it doesn't get serialized
        display(GalaxyAuthWidget(self.session))     # Display the authenticated widget
        self.close()   # Close the unauthenticated widget

    def register_session(self):
        """Register the validated credentials with the SessionList"""
        self.session = session.register(self.session._notebook_url, self.session._notebook_email, self.session._notebook_password)

    def register_modules(self):
        """Get the list available modules (currently only tools) and register widgets for them with the tool manager"""
        for tool in self.session.tools.list():
            tool = self.session.tools.get(tool.id, io_details=True)
            tool = TaskTool(server_name(self.session._notebook_url), tool)
            ToolManager.instance().register(tool)
   
    def system_message(self):
        self.info = "Successfully logged into Galaxy"

    def trigger_login(self):
        """Dispatch a login event after authentication"""
        # Trigger login callbacks of job and task widgets
        return
        print("trigger_login")
        EventManager.instance().dispatch("galaxy.login", self.session)

def server_name(search_url):
    """Search the GALAXY_SERVERS dict for the server with the matching URL"""
    for name, url in GALAXY_SERVERS.items():
        if url == search_url: return name
    return search_url

class AuthenticationTool(NBTool):
    """Tool wrapper for the authentication widget"""
    origin = '+'
    id = 'galaxy_authentication'
    name = 'Galaxy Login'
    description = 'Log into a Galaxy server'
    load = lambda x: GalaxyAuthWidget()


# Register the authentication widget
ToolManager.instance().register(AuthenticationTool())
