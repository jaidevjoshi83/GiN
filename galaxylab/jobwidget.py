from threading import Timer
from urllib.error import HTTPError

from ipywidgets import Dropdown, Button, VBox, HBox


from .shim import get_permissions, set_permissions, get_token
from nbtools import EventManager, ToolManager, UIOutput
from .util import DEFAULT_COLOR, DEFAULT_LOGO

from .uioutput import GalaxyUIOutput



class GalaxyJobWidget(GalaxyUIOutput):
    """A widget for representing the status of a Galaxy job"""
    default_color = DEFAULT_COLOR
    default_logo = DEFAULT_LOGO
    sharing_displayed = False
    job = None
    gi = None

    def __init__(self, job=None, gi=None, **kwargs):
        """Initialize the job widget"""
        UIOutput.__init__(self, color=self.default_color, logo=self.default_logo, **kwargs)
        self.job = job
        self.gi = gi
        self.poll()  # Query the Galaxy server and begin polling, if needed
        #self.attach_detach()
        #self.attach_sharing()

        # Register the event handler for Galaxy login
        EventManager.instance().register("gp.login", self.login_callback) #ToDo

    def poll(self):
        """Poll the Galaxy server for the job info and display it in the widget"""
        if self.job is not None:
            try:  # Attempt to load the job info from the Galaxy server
                self.gi.jobs.show_job(self.job['jobs'][0]['id'], full_details=True)
            except HTTPError:  # Handle HTTP errors contacting the server
                self.name = 'Error Loading Job'
                self.error = 'Error loading job #'+self.job['jobs'][0]['id']
                return

            # Add the job information to the widget
            self.name = self.job['jobs'][0]['id']
            self.status = self.gi.jobs.get_state(self.job['jobs'][0]['id'])
            self.description = self.submitted_text()
            self.files = self.files_list()
            self.visualization = self.visualizer()

            # Send notification if completed
            self.handle_notification()

            self.poll_if_needed()
        else:
            # Display error message if no initialized Galaxy Job object is provided #ToDo
            self.name = 'Not Authenticated'
            self.error = 'You must be authenticated before the job can be displayed. After you authenticate it may take a few seconds for the information to appear.'

    def visualizer(self):
        if self.job is None: return  # Ensure the job has been set
        # Make this provide a link to interactive tools, if created: check job['produces_entry_points']

        '''
        # Get the token, using the shim if necessary
        if hasattr(self.job.server_data, 'get_token'): 
            token = self.job.server_data.get_token()
            print(token)
        else: 
            token = get_token(self.job.server_data)
            print(token)

        # Handle server-relative URLs
        if 'launchUrl' in self.job.info:
            launch_url = self.job.info["launchUrl"]
            if launch_url[0] == '/': launch_url = launch_url[3:]
            return f'{self.job.server_data.url}{launch_url}#{token}'

        # Handle index.html or single HTML returns
        single_html = None
        for f in self.files:
            if f.endswith('/index.html'):
                return f
            elif f.endswith('.html') and single_html is None:
                single_html = f
            elif f.endswith('.html') and single_html is not None:
                single_html = False
        if single_html: return f'{single_html}#{token}'
        '''
        # Otherwise there is no visualizer
        return ''

    def poll_if_needed(self):
        """Begin a polling interval if the job is pending or running"""
        if self.status not in ['ok', 'error']:
            timer = Timer(5.0, lambda: self.poll())
            timer.start()

    def submitted_text(self):
        """Return pretty job submission text"""
        if self.job is None: 
            return  # Ensure the job has been set
        user = self.gi.users.get_current_user()
        user = user.get('username') or user.get('email')
        #user = self.gi.jobs.show_job(self.job['jobs'][0]['id'], full_details=True)['user_email']
        time = self.gi.jobs.show_job(self.job['jobs'][0]['id'], full_details=True)['create_time']

        return 'Submitted by '+user+' on '+time

    def files_list(self):
        """Return the list of output and log files in the format the widget can handle"""
        if self.job is None: return 
        outputs = self.gi.jobs.show_job(self.job['jobs'][0]['id'], full_details=True)['outputs']
        rval = []
        for k, val in outputs.items():
            #'out_file1', {'id': '3f31f86793710874', 'src': 'hda', 'uuid': '0e89ea41-95ae-4475-b998-d08ce1167bef'}
            rval.append('%s: %s' % (k, val['id']))
        #return list(self.gi.jobs.show_job(self.job['jobs'][0]['id'], full_details=True)['outputs'].keys())
        return list(rval)

    def handle_notification(self):
        if self.status == 'error':
            ToolManager.instance().send('notification', {'message': f'Job #{self.name} has an error!', 'sender': 'Galaxy/GalaxyLab Notebook'})
        elif self.status == 'ok':
            ToolManager.instance().send('notification', {'message': f'Job #{self.name} is complete!', 'sender': 'Galaxy/GalaxyLab Notebook'})

    def status_text(self): #ToDo
        """Return concise status text"""
        if self.job is None: return ''  # Ensure the job has been set
        if 'hasError' in self.job.info['status'] and self.job.info['status']['hasError']:
            return 'Error'
        elif 'completedInGp' in self.job.info['status'] and self.job.info['status']['completedInGp']:
            return 'Completed'
        elif 'isPending' in self.job.info['status'] and self.job.info['status']['isPending']:
            return 'Pending'
        else:
            return 'Running'

    def attach_detach(self): #ToDo
        """Attach the menu option to detach the job widget from the analysis cell"""
        self.extra_menu_items = {**self.extra_menu_items, **{'Detach Job': {
                'action': 'cell',
                'code': f"import \n\ngalaxy.display(self.gi.jobs.show_job(self.job['jobs'][0]['id'], full_details=True))"  # FIXME: support non-default sessions
            }}}

    def attach_sharing(self):
        if self.sharing_displayed: self.toggle_job_sharing()  # Display sharing if toggled on
        self.extra_menu_items = {**self.extra_menu_items, **{'Share Job': {
                'action': 'method',
                'code': 'toggle_job_sharing'
            }}}

    def build_sharing_controls(self):
        """Create and return a VBox with the job sharing controls"""
        # Query job permissions, using the shim if necessary
        if hasattr(self.job, 'get_permissions'):
            perms = self.job.get_permissions()
        else:
            perms = get_permissions(self.job)
        group_widgets = []

        # Build the job sharing form by iterating over groups
        for g in perms['groups']:
            d = Dropdown(description=g['id'], options=['Private', 'Read', 'Read & Write'])
            if g['read'] and g['write']:
                d.value = 'Read & Write'
            elif g['read']:
                d.value = 'Read'
            group_widgets.append(d)

        # Cancel / Close the sharing form functionality
        cancel_button = Button(description='Cancel')
        cancel_button.on_click(lambda b: self.toggle_job_sharing())

        # Save sharing permissions functionality
        def save_permissions(button):
            save_perms = []
            for g in group_widgets:
                if g.value == 'Read & Write':
                    save_perms.append({'id': g.description, 'read': True, 'write': True})
                elif g.value == 'Read':
                    save_perms.append({'id': g.description, 'read': True, 'write': False})
                else:
                    save_perms.append({'id': g.description, 'read': False, 'write': False})
            # Save the permissions, using the shim if necessary
            if hasattr(self.job, 'set_permissions'):
                self.job.set_permissions(save_perms)
            else:
                set_permissions(self.job, save_perms)
            self.toggle_job_sharing()

        save_button = Button(description='Save', button_style='info')
        save_button.on_click(save_permissions)

        # Create the button HBox
        button_box = HBox(children=[cancel_button, save_button])

        # Create the job sharing box and attach to the job widget
        return VBox(children=group_widgets + [button_box])

    def toggle_job_sharing(self):
        """Toggle displaying the job sharing controls off and on"""
        # Handle None's
        if self.job is None or self.job.server_data is None:
            return  # Ignore this call if the job has not been properly initialized

        if self.sharing_displayed:
            # Add the old appendix children back to the widget if any exist, else simply remove the sharing box
            self.appendix.children = self.sharing_displayed if self.sharing_displayed is not True else []
            self.sharing_displayed = False
        else:
            # Create the job sharing box
            permissions_box = self.build_sharing_controls()
            # Save any child widgets in the appendix so that they're available when toggled back on
            self.sharing_displayed = self.appendix.children if self.appendix.children else True
            # Attach to the job widget
            self.appendix.children = [permissions_box]

    def login_callback(self, data):
        """Callback for after a user authenticates"""
        if self.job is not None:
            self.job.server_data = data
            self.error = ''
            self.poll()
