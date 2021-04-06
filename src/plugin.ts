// Copyright (c) Jayadev Joshi
// Distributed under the terms of the Modified BSD License.

import { Application, IPlugin } from '@lumino/application';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import * as base_exports from '@genepattern/nbtools';
import * as uioutput_exports from '@genepattern/nbtools';
import * as uibuilder_exports from '@genepattern/nbtools';
import * as galaxyuioutput_exports from './widget';


const module_exports = { ...base_exports, ...uioutput_exports, ...uibuilder_exports, ...galaxyuioutput_exports };


import { MODULE_NAME, MODULE_VERSION } from './version';

const EXTENSION_ID = '@galaxy/galaxylab:plugin';

/**
 * The example plugin.
 */
const examplePlugin: IPlugin<Application<Widget>, void> = ({
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry],
  activate: activateWidgetExtension,
  autoStart: true,
} as unknown) as IPlugin<Application<Widget>, void>;
// the "as unknown as ..." typecast above is solely to support JupyterLab 1
// and 2 in the same codebase and should be removed when we migrate to Lumino.

export default examplePlugin;

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  app: Application<Widget>,
  registry: IJupyterWidgetRegistry
): void {
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: module_exports,
  });
}
