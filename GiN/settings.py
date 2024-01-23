import os
import json
import logging
import jupyter_core.paths
from IPython import get_ipython


def load_settings():
    """Attempt to load the GiN settings files, fall back to default if not available"""
    load = []
    for p in jupyter_core.paths.jupyter_path():  # Get Jupyter data paths
        GiN_path = os.path.join(p, "GiN")
        if os.path.exists(GiN_path) and os.path.isdir(GiN_path):  # Check for GiN config
            json_files = [
                j for j in os.listdir(GiN_path) if j.endswith(".json")
            ]  # Check for json in config dir
            for jf in json_files:  # Loop over json files
                try:
                    with open(
                        os.path.join(GiN_path, jf)
                    ) as json_file:  # Load and parse
                        data = json.load(json_file)
                        if (
                            "load" in data and type(data["load"]) is list
                        ):  # Ensure correct json format
                            load += data["load"]  # Add packages to load list
                except FileNotFoundError as e:
                    logging.debug(f"GiN setting file not found: {e}")
                except json.JSONDecodeError as e:
                    logging.debug(f"unable to parse GiN setting file: {e}")

    # If packages were read, return the list to load
    if len(load):
        return {"load": list(set(load))}
    # If it couldn't be loaded, return the default settings
    else:
        return {"load": ["GiN"]}


def import_defaults():
    settings = load_settings()
    for module in settings["load"]:
        if module == "GiN":  # Special case so that GiN import detection works
            get_ipython().run_cell(f"import GiN as _GiN")
        else:
            get_ipython().run_cell(f"import {module}")

