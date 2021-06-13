#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jayadev Joshi.
# Distributed under the terms of the Modified BSD License.

from nbtools import UIOutput

from ipywidgets import VBox, widget_serialization
from traitlets import Unicode, List, Dict, Instance
from ._frontend import module_name, module_version
import bioblend
from bioblend.galaxy.objects import *
#from .basewidget import BaseWidget



class TestUIOutput(UIOutput):
    """
    Widget used to render Python output in a UI
    """
    _model_name = Unicode('TestUIOutputModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    _view_name = Unicode('TestUIOutputView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    name = Unicode('Python Results').tag(sync=True)
    status = Unicode('').tag(sync=True)
    files = List(Unicode, []).tag(sync=True)
    text = Unicode('').tag(sync=True)
    visualization = Unicode('').tag(sync=True)
    appendix = Instance(VBox).tag(sync=True, **widget_serialization)
    extra_file_menu_items = Dict().tag(sync=True)

    gi = GalaxyInstance("http://127.0.0.1:8080", email="jaidev53ster@gmail.com", api_key="c4ba1ea68dc49eacaba2fdc0fc8585d5", verify=True)
    a = bioblend.galaxy.objects.client.ObjToolClient(gi)
    tool = a.get(id_='testtoolshed.g2.bx.psu.edu/repos/jay/pdaug_peptide_global_descriptors/pdaug_peptide_global_descriptors/0.1.0',  io_details=True)

    inputs = tool.wrapped['inputs'][0]
    inputs = Dict(inputs).tag(sync=True)

    def __init__(self, **kwargs):
        # Initialize the child widget container
        self.appendix = VBox()

        UIOutput.__init__(self, **kwargs)