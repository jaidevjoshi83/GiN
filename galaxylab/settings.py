import os
import json
import logging
import jupyter_core.paths
from IPython import get_ipython


def load_settings():
    """Attempt to load the galaxylab settings files, fall back to default if not available"""
    load = []
    for p in jupyter_core.paths.jupyter_path():                                         # Get Jupyter data paths
        galaxylab_path = os.path.join(p, 'galaxylab')
        if os.path.exists(galaxylab_path) and os.path.isdir(galaxylab_path):                # Check for galaxylab config
            json_files = [j for j in os.listdir(galaxylab_path) if j.endswith('.json')]   # Check for json in config dir
            for jf in json_files:                                                       # Loop over json files
                try:
                    with open(os.path.join(galaxylab_path, jf)) as json_file:             # Load and parse
                        data = json.load(json_file)
                        if 'load' in data and type(data['load']) is list:               # Ensure correct json format
                            load += data['load']                                        # Add packages to load list
                except FileNotFoundError as e:
                    logging.debug(f'galaxylab setting file not found: {e}')
                except json.JSONDecodeError as e:
                    logging.debug(f'unable to parse galaxylab setting file: {e}')

    # If packages were read, return the list to load
    if len(load): return {"load": list(set(load))}
    # If it couldn't be loaded, return the default settings
    else: return {"load": ["galaxylab"]}


def import_defaults():
    settings = load_settings()
    for module in settings['load']:
        if module == 'galaxylab':  # Special case so that galaxylab import detection works
            get_ipython().run_cell(f'import galaxylab as _galaxylab')
        else:
            get_ipython().run_cell(f'import {module}')
