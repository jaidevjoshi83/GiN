//var plugin = require('./index');
//var base = require('@jupyter-widgets/base');

//module.exports = {
//  id: 'galaxylab:plugin',
//  requires: [base.IJupyterWidgetRegistry],
//  activate: function(app, widgets) {
//      widgets.registerWidget({
//          name: 'galaxylab',
//          version: plugin.version,
//          exports: plugin
//      });
//  },
//  autoStart: true
// };



// Copyright (c) Jayadev Joshi
// Distributed under the terms of the Modified BSD License.

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import * as base_exports from '@genepattern/nbtools';
import * as uioutput_exports from '@genepattern/nbtools';
import * as uibuilder_exports from '@genepattern/nbtools';
import * as galaxyuioutput_exports from './galaxyoutput';
import * as galaxyuibuilder_exports from './Galaxyuibuilder';
import * as utils_exports from './utils';
import * as example1_exports from './example1';
const module_exports = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, base_exports), uioutput_exports), uibuilder_exports), galaxyuioutput_exports), example1_exports), galaxyuibuilder_exports), utils_exports) ;
import { MODULE_NAME, MODULE_VERSION } from './version';
const EXTENSION_ID = 'galaxylab:plugin';
/**
 * The example plugin.
 */
const examplePlugin = {
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry],
    activate: activateWidgetExtension,
    autoStart: true,
};
// the "as unknown as ..." typecast above is solely to support JupyterLab 1
// and 2 in the same codebase and should be removed when we migrate to Lumino.
export default examplePlugin;
/**
 * Activate the widget extension.
 */
function activateWidgetExtension(app, registry) {
    registry.registerWidget({
        name: 'galaxylab',
        version: '0.1.0',
        exports: module_exports,
    });
}
