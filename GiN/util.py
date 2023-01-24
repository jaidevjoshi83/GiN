"""
Useful things across modules.
"""

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
