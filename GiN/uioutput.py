#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jayadev Joshi.
# Distributed under the terms of the Modified BSD License.

from nbtools import UIOutput

from ipywidgets import VBox, widget_serialization
from traitlets import Unicode, List, Dict, Instance
from ._frontend import module_name, module_version

# from .basewidget import BaseWidget


class GalaxyUIOutput(UIOutput):
    """
    Widget used to render Python output in a UI
    """

    _model_name = Unicode("GalaxyUIOutputModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    _view_name = Unicode("GalaxyUIOutputView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    name = Unicode("Python Results").tag(sync=True)
    status = Unicode("").tag(sync=True)
    files = List(Unicode, []).tag(sync=True)
    text = Unicode("").tag(sync=True)
    visualization = Unicode("").tag(sync=True)
    appendix = Instance(VBox).tag(sync=True, **widget_serialization)
    extra_file_menu_items = Dict().tag(sync=True)

    def __init__(self, **kwargs):
        # Initialize the child widget container
        self.appendix = VBox()

        UIOutput.__init__(self, **kwargs)
