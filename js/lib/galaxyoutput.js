/**
 * Widget for representing Python output as an interactive interface
 *
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */
import '../style/galaxyoutput.css';
import './dist/base.css'
import { unpack_models } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { UIOutputView, UIOutputModel } from "@genepattern/nbtools";
import * as options from './dist/analysis.bundled.js'

//import { extract_file_name, extract_file_type, is_absolute_path, is_url } from '@genepattern/nbtools';
//import { ContextManager } from "@genepattern/nbtools";

export class GalaxyUIOutputModel extends UIOutputModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyUIOutputModel.model_name, _model_module: GalaxyUIOutputModel.model_module, _model_module_version: GalaxyUIOutputModel.model_module_version, _view_name: GalaxyUIOutputModel.view_name, _view_module: GalaxyUIOutputModel.view_module, _view_module_version: GalaxyUIOutputModel.view_module_version, name: 'Python Results', description: '', status: '', files: [], text: '', visualization: '', appendix: undefined, extra_file_menu_items: {} });
    }
}
GalaxyUIOutputModel.model_name = 'GalaxyUIOutputModel';
GalaxyUIOutputModel.model_module = MODULE_NAME;
GalaxyUIOutputModel.model_module_version = MODULE_VERSION;
GalaxyUIOutputModel.view_name = 'GalaxyUIOutputView';
GalaxyUIOutputModel.view_module = MODULE_NAME;
GalaxyUIOutputModel.view_module_version = MODULE_VERSION;
GalaxyUIOutputModel.serializers = Object.assign(Object.assign({}, UIOutputModel.serializers), { appendix: {
        deserialize: (value, manager) => unpack_models(value, manager)
    } });
export class GalaxyUIOutputView extends UIOutputView {
    constructor() {
        super(...arguments);
        this.dom_class = 'nbtools-galaxyuioutput';
    }
}
