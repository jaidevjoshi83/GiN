#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jayadev Joshi.
# Distributed under the terms of the Modified BSD License.
import json
from pathlib import Path
from .settings import load_settings, import_defaults
# try:
from .authwidget import GALAXY_SERVERS, GalaxyAuthWidget
# except:
#     pass
from .taskwidget import GalaxyTaskWidget    
from .sessions import session, get_session
from .uioutput import GalaxyUIOutput
from .Galaxyuibuilder import GalaxyUIBuilder
# from .galaxyUpload import GalaxyUpload
from ._version import __version__


HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "GiN"
    }]

def _jupyter_nbextension_paths():

    return [
        {
            "section": "notebook",
            "src": "nbextension",
            "dest": "GiN",
            "require": "GiN/extension",
        }
    ]


__author__ = "Jayadev Joshi"
__copyright__ = "Copyright 2021 Galaxy Contributors"
__version__ = "0.1.0"
__status__ = "prealpha"
__license__ = "BSD-3-Clause"

