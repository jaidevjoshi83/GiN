"use strict";
// Copyright (c) jayadev joshi
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalaxyOutputView = exports.GalaxyOutputModel = void 0;
const base_1 = require("@jupyter-widgets/base");
const version_1 = require("./version");
// Import the CSS
require("../css/widget.css");
class GalaxyOutputModel extends base_1.DOMWidgetModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { _model_name: GalaxyOutputModel.model_name, _model_module: GalaxyOutputModel.model_module, _model_module_version: GalaxyOutputModel.model_module_version, _view_name: GalaxyOutputModel.view_name, _view_module: GalaxyOutputModel.view_module, _view_module_version: GalaxyOutputModel.view_module_version, value: 'Hello World' });
    }
}
exports.GalaxyOutputModel = GalaxyOutputModel;
GalaxyOutputModel.serializers = Object.assign({}, base_1.DOMWidgetModel.serializers);
GalaxyOutputModel.model_name = 'GalaxyOutputModel';
GalaxyOutputModel.model_module = version_1.MODULE_NAME;
GalaxyOutputModel.model_module_version = version_1.MODULE_VERSION;
GalaxyOutputModel.view_name = 'GalaxyOutputView'; // Set to null if no view
GalaxyOutputModel.view_module = version_1.MODULE_NAME; // Set to null if no view
GalaxyOutputModel.view_module_version = version_1.MODULE_VERSION;
class GalaxyOutputView extends base_1.DOMWidgetView {
    render() {
        this.el.classList.add('custom-widget');
        this.value_changed();
        this.model.on('change:value', this.value_changed, this);
    }
    value_changed() {
        this.el.textContent = this.model.get('value');
    }
}
exports.GalaxyOutputView = GalaxyOutputView;
//# sourceMappingURL=widget.js.map