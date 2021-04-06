"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalaxyUIOutputView = exports.GalaxyUIOutputModel = void 0;
/**
 * Widget for representing Python output as an interactive interface
 *
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */
require("../css/output.css");
const base_1 = require("@jupyter-widgets/base");
const version_1 = require("./version");
const nbtools_1 = require("@genepattern/nbtools");
//import { extract_file_name, extract_file_type, is_absolute_path, is_url } from '@genepattern/nbtools';
//import { ContextManager } from "@genepattern/nbtools";
class GalaxyUIOutputModel extends nbtools_1.UIOutputModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyUIOutputModel.model_name, _model_module: GalaxyUIOutputModel.model_module, _model_module_version: GalaxyUIOutputModel.model_module_version, _view_name: GalaxyUIOutputModel.view_name, _view_module: GalaxyUIOutputModel.view_module, _view_module_version: GalaxyUIOutputModel.view_module_version, name: 'Python Results', description: '', status: '', files: [], text: '', visualization: '', appendix: undefined, extra_file_menu_items: {} });
    }
}
exports.GalaxyUIOutputModel = GalaxyUIOutputModel;
GalaxyUIOutputModel.model_name = 'GalaxyUIOutputModel';
GalaxyUIOutputModel.model_module = version_1.MODULE_NAME;
GalaxyUIOutputModel.model_module_version = version_1.MODULE_VERSION;
GalaxyUIOutputModel.view_name = 'GalaxyUIOutputView';
GalaxyUIOutputModel.view_module = version_1.MODULE_NAME;
GalaxyUIOutputModel.view_module_version = version_1.MODULE_VERSION;
GalaxyUIOutputModel.serializers = Object.assign(Object.assign({}, nbtools_1.UIOutputModel.serializers), { appendix: {
        deserialize: (value, manager) => base_1.unpack_models(value, manager)
    } });
class GalaxyUIOutputView extends nbtools_1.UIOutputView {
    constructor() {
        super(...arguments);
        this.dom_class = 'nbtools-galaxyuioutput';
    }
}
exports.GalaxyUIOutputView = GalaxyUIOutputView;
//# sourceMappingURL=widget.js.map