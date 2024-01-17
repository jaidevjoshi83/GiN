from IPython import get_ipython
from IPython.display import display
from ipywidgets import Output
from threading import Timer, Thread
from time import time
from .event_manager import GalaxyEventManager
from .uioutput import UIOutput
from nbtools import NBTool, ToolManager

class GalaxyToolManager(ToolManager):
    COMM_NAME = 'gin_comm'  # The name of the kernel <-> client comm
    _instance = None            # ToolManager singleton

    @staticmethod
    def instance():
        if GalaxyToolManager._instance is None:
            GalaxyToolManager._instance = GalaxyToolManager()
        return GalaxyToolManager._instance

    def __init__(self):
        self.tools = {}             # Initialize the tools map
        self.comm = None            # The comm to communicate with the client
        self.last_update = 0        # The last time the client was updated
        self.update_queued = False  # Waiting for an update?

        # Create the nbtools comm target
        def comm_target_1(comm, open_msg):
            # Handle messages sent to the comm target
            @comm.on_msg
            def receive(msg):
                data = msg['content']['data']
                if data['func'] == 'request_update':
                    self.send_update()
                else:
                    print('ToolManager received unknown message')

            # Keep a reference to the comm
            self.comm = comm

        # Register the comm target
        get_ipython().kernel.comm_manager.register_target(GalaxyToolManager.COMM_NAME, comm_target_1)

 
    def send_update(self):

        self.last_update = time()
        self.send('update', {
            'import': 'nbtools' in get_ipython().user_global_ns,
            'tools': list(map(lambda t: t.json_safe(), self._list()))
        })

    def send(self, message_type, payload):
        """
        Send a message to the comm on the client

        :param message_type:
        :param payload:
        :return:
        """
        # Protect against uninitialized comms

        if self.comm is None: return
      

        # Make a call to the comm in its own thread so that it doesn't block cell execution
        Thread(target=lambda: self.comm.send({ "func": message_type, "payload": payload })).start()

    def _list(self):
        """
        Get the list of registered tools

        :return: list of tools
        """
        tools = self.tools
        to_return = []
        for o in tools.values():
            for t in o.values():
                to_return.append(t)
        return to_return

    def update_stale(self):
        return self.last_update + 3 < time()

    def queue_update(self):
        def postponed_update():
            """Function to call once after a 3-second cool-off period"""
            self.send_update()
            self.update_queued = False

        # If no update is waiting, queue an update
        if not self.update_queued:
            wait = abs(self.last_update - time())
            timeout = Timer(3, postponed_update)
            self.update_queued = True
            timeout.start()

    @classmethod
    def list(cls):
        """
        Get the list of registered tools

        :return: list of tools
        """
        # return [t for t in o.values() for o in cls.instance().tools.values()]
        return cls.instance()._list()

    @classmethod
    def register(cls, tool_or_widget):
        """Register a NBTool or UIBuilder object"""
        if isinstance(tool_or_widget, NBTool):
            tools = cls.instance().tools
            if tool_or_widget.origin and tool_or_widget.id:
                # Lazily create the origin
                if tool_or_widget.origin not in tools:
                    tools[tool_or_widget.origin] = {}

                # Register the tool
                cls.instance().tools[tool_or_widget.origin][tool_or_widget.id] = tool_or_widget

                # Notify the client of the registration
                cls.instance().send_update()

                # Dispatch the register event
                GalaxyEventManager.instance().dispatch('nbtools.register', {
                    'origin': tool_or_widget.origin,
                    'id': tool_or_widget.id
                })
            else:
                raise ValueError("register() must be passed a tool with an instantiated origin and id")
        else:
            raise ValueError("register() must be passed an NBTool or UIBuilder object")

    @classmethod
    def unregister(cls, origin, id):
        """Unregister the tool with the associated id"""
        if cls.exists(id, origin):
            del cls.instance().tools['origin']['id']

            # Notify the client of the un-registration
            cls.instance().send_update()
        else:
            print(f'Cannot find tool to unregister: {origin} | {id}')

    @classmethod
    def tool(cls, id, origin='Notebook'):
        """
        Return reference to tool widget given the id and origin
        """
        if cls.exists(id, origin):
            return cls.instance().tools[origin][id]
        else:
            display(cls.create_placeholder_widget(origin, id))

    @classmethod
    def create_placeholder_widget(cls, origin, id):
        output = Output()                                                                            # Output widget
        placeholder = UIOutput(name='Cannot find tool', error=f'Cannot find tool: {origin} | {id}')  # Placeholder widget
        output.append_display_data(placeholder)

        # Callback to see if the placeholder needs replaced after a new widget is registered
        def check_registration_callback(data):
            if 'origin' in data and 'id' in data and data['origin'] == origin and data['id'] == id:
                placeholder.close()
                with output: display(tool(id=id, origin=origin))

        # Register the callback with the event manager
        GalaxyToolManager.instance().register("nbtools.register", check_registration_callback)
        return output

    @classmethod
    def exists(cls, id, origin):
        """Check if a tool for the provided id and origin exists"""
        tools = cls.instance().tools
        if origin in tools:
            if id in tools[origin]:
                return True
            else: return False
        else: return False


def tool(id, origin, **kwargs):
    nbtool = GalaxyToolManager.tool(id=id, origin=origin)
    if nbtool:  # Call load() passing kwargs only if kwargs are accepted
        try: return nbtool.load(**kwargs)
        except TypeError: return nbtool.load()
