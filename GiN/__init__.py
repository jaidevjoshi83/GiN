#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jayadev Joshi.
# Distributed under the terms of the Modified BSD License.
import json
from pathlib import Path

try:
    from .authwidget import GALAXY_SERVERS, GalaxyAuthWidget
except:
    pass

import .authwidget
from .taskwidget import GalaxyTaskWidget
from .jobwidget import GalaxyJobWidget
from .sessions import session, get_session

# from .galaxyoutput import GalaxyOutputWidget
from .uioutput import GalaxyUIOutput
from .Galaxyuibuilder import GalaxyUIBuilder

# from .JobSubmit import Job
from ._version import __version__


HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": data["name"]}]


def _jupyter_labextension_paths():
    """Called by Jupyter Lab Server to detect if it is a valid labextension and
    to install the widget
    Returns
    =======
    src: Source directory name to copy files from. Webpack outputs generated files
        into this directory and Jupyter Lab copies from this directory during
        widget installation
    dest: Destination directory name to install widget files to. Jupyter Lab copies
        from `src` directory into <jupyter path>/labextensions/<dest> directory
        during widget installation
    """
    return [
        {
            "src": "labextension",
            "dest": "GiN",
        }
    ]


def _jupyter_nbextension_paths():
    """Called by Jupyter Notebook Server to detect if it is a valid nbextension and
    to install the widget
    Returns
    =======
    section: The section of the Jupyter Notebook Server to change.
        Must be 'notebook' for widget extensions
    src: Source directory name to copy files from. Webpack outputs generated files
        into this directory and Jupyter Notebook copies from this directory during
        widget installation
    dest: Destination directory name to install widget files to. Jupyter Notebook copies
        from `src` directory into <jupyter path>/nbextensions/<dest> directory
        during widget installation
    require: Path to importable AMD Javascript module inside the
        <jupyter path>/nbextensions/<dest> directory
    """
    return [
        {
            "section": "notebook",
            "src": "nbextension",
            "dest": "GiN",
            "require": "GiN/extension",
        }
    ]


# from .display import display

__author__ = "Jayadev Joshi"
__copyright__ = "Copyright 2021 Galaxy Contributors"
__version__ = "0.1.0"
__status__ = "prealpha"
__license__ = "BSD-3-Clause"
