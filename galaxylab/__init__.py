#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jayadev Joshi.
# Distributed under the terms of the Modified BSD License.


from .authwidget import GALAXY_SERVERS, GalaxyAuthWidget
from .taskwidget import GalaxyTaskWidget
from .jobwidget import GalaxyJobWidget
from .sessions import session, get_session
#from .galaxyoutput import GalaxyOutputWidget
from .uioutput import GalaxyUIOutputModel
from ._version import __version__, version_info

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
    return [{
        'src': 'labextension',
        'dest': '@galaxy/galaxylab',
    }]


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
    return [{
        'section': 'notebook',
        'src': 'nbextension',
        'dest': 'galaxylab',
        'require': 'galaxylab/extension'
    }]

#from .display import display

__author__ = 'Jayadev Joshi'
__copyright__ = 'Copyright 2021 Galaxy Contributors'
__version__ = '0.1.0'
__status__ = 'prealpha'
__license__ = 'BSD-3-Clause'




