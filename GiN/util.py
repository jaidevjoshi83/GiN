"""
Useful things across modules.
"""
import glob , os

DEFAULT_COLOR = "#2c3143"
DEFAULT_LOGO = "https://usegalaxy.org/static/favicon.svg"

GALAXY_SERVERS = {
    "Galaxy Main": "https://usegalaxy.org",
    "Galaxy Europe": "https://usegalaxy.eu",
    "Galaxy Australia": "https://usegalaxy.org.au",
    "Galaxy Local": "http://localhost:8080",
}

GALAXY_SERVER_NAME_BY_URL = {}
for k, v in GALAXY_SERVERS.items():
    GALAXY_SERVER_NAME_BY_URL[v] = k

def delete_file():

    temp_dir = os.path.join(os.getcwd(), "temp")
    if os.path.exists(temp_dir):
        file_path = glob.glob(os.path.join(temp_dir, '*'))
        for i in file_path:
            os.remove(i)
    

