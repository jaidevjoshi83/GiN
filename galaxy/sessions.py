
from bioblend import galaxy

class SessionList:
    """
    Keeps a list of all currently registered Galaxy server sessions
    """
    sessions = []

    def register(self, server, username, password):
        """
        Register a new Galaxy  server session for the provided
        server, username and password. Return the session.
        :param server:
        :param username:
        :param password:
        :return:
        """

        # Create the session
        #session = GalaxyInstance(server, email=username, password=password, verify=True)
        session = galaxy.GalaxyInstance(server, email=username, password=password, verify=True)

        #print (session)

        # Validate username if not empty
        valid_username = username != "" and username is not None

        # Validate that the server is not already registered
        index = self._get_index(server)
        new_server = index == -1

        # Add the new session to the list
        if valid_username and new_server:
            self.sessions.append(session)

        # Replace old session is one exists
        if valid_username and not new_server:
            self.sessions[index] = session

       # print(session)

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
            if session.url == server_url:
                return i
        return -1

"""
Galaxy Sessions Singleton
"""
session = SessionList()


def get_session(index):
    return session.get(index)