# from bioblend import galaxy
from bioblend.galaxy.objects import GalaxyInstance
import IPython


class SessionList:
    """
    Keeps a list of all currently registered Galaxy server sessions
    """

    sessions = []
    galaxy_upload = {}

    def register(self, server, email=None, password=None, api_key=None):
        """
        Register a new Galaxy  server session for the provided
        server, email and password. Return the session.
        :param server:
        :param email:
        :param password:
        :return:
        """

        # Create the session
        if (password):
            session = GalaxyInstance(server, email=email, password=password, verify=True) 
            session._notebook_password = password
            
        else:
            session = GalaxyInstance(server,  api_key=api_key,  verify=True)
            
       
        session._notebook_url = server
        session._notebook_email = email
        

        # Validate email if not empty
        valid_email = email is not None

        # Validate that the server is not already registered
        index = self._get_index(server)
        new_server = index == -1

        # Add the new session to the list
        if valid_email and new_server:
            self.sessions.append(session)

        # Replace old session is one exists
        if valid_email and not new_server:
            self.sessions[index] = session

        return session

    def get(self, server):
        """
        Returns a registered GalaxyServer object with a matching Galaxy server url or index
        Returns None if no matching result was found
        :param server:
        :return:
        """

        # Handle indexes
        if isinstance(server, int):
            if server >= len(self.sessions):
                return None
            else:
                return self.sessions[server]

        # Handle server URLs
        index = self._get_index(server)
        if index == -1:
            return None
        else:
            return self.sessions[index]

    def get_servers(self):
        servers = []

        if(self.sessions):
            for session in self.sessions:
                servers.append(session._notebook_url)
            return IPython.display.JSON(servers)
        else:
            return IPython.display.JSON([])

    def clean(self):
        """
        Clear all Galaxy sessions from the sessions list
        :return:
        """
        self.sessions = []

    def _get_index(self, server_url):
        """
        Returns a registered GalaxyServer object with a matching Galaaxy server url
        Returns -1 if no matching result was found
        :param server_url:
        :return:
        """
        for i in range(len(self.sessions)):
            session = self.sessions[i]
            if session._notebook_url == server_url:
                return i
        return -1


"""
Galaxy Sessions Singleton
"""
session = SessionList()


def get_session(index):
    return session.get(index)