// Copyright (c) jayadev joshi
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';

export class GalaxyOutputModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: GalaxyOutputModel.model_name,
      _model_module: GalaxyOutputModel.model_module,
      _model_module_version: GalaxyOutputModel.model_module_version,
      _view_name: GalaxyOutputModel.view_name,
      _view_module: GalaxyOutputModel.view_module,
      _view_module_version: GalaxyOutputModel.view_module_version,
      value: 'Hello World',
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'GalaxyOutputModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'GalaxyOutputView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class GalaxyOutputView extends DOMWidgetView {
  render() {
    this.el.classList.add('custom-widget');

    this.value_changed();
    this.model.on('change:value', this.value_changed, this);
  }

  value_changed() {
    this.el.textContent = this.model.get('value');
  }
}
