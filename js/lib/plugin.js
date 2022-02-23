import { IJupyterWidgetRegistry} from '@jupyter-widgets/base';
import { ILabShell, ILayoutRestorer } from "@jupyterlab/application";
import { INotebookTracker } from '@jupyterlab/notebook';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ToolRegistry}  from '@genepattern/nbtools'
// import { ContextManager } from '@genepattern/nbtools';
import { ContextManager } from '@genepattern/nbtools/lib/context';
import * as galaxyuioutput_exports from './galaxyoutput';
import * as galaxyuibuilder_exports from './Galaxyuibuilder';
import * as utils_exports from './utils'
import * as fileupload from './FileUpload'
import { MODULE_NAME, MODULE_VERSION } from './version';

const module_exports = Object.assign(Object.assign(Object.assign(Object.assign({},   galaxyuioutput_exports), galaxyuibuilder_exports), utils_exports));


const EXTENSION_ID = 'galaxylab:plugin';
/**
 * The example plugin.
 */
 const galaxy_plugin = {
    id: EXTENSION_ID,
    //provides: IGalaxyTool,
    requires: [IJupyterWidgetRegistry],
    optional: [IMainMenu, ILayoutRestorer, ILabShell, INotebookTracker],
    activate: activateWidgetExtension,
    autoStart: true,
};
export default galaxy_plugin;
/**
 * Activate the widget extension.
 * 
 */
function activateWidgetExtension(app, registry, mainmenu, restorer, shell, notebook_tracker) {

    init_context(app, notebook_tracker)
    const tool_registry = new ToolRegistry();
    
    registry.registerWidget({
        name: 'galaxylab',
        version: '0.1.0',
        exports: module_exports,
    });
    return tool_registry
}

function init_context(app, notebook_tracker) {
    ContextManager.jupyter_app = app;
    ContextManager.notebook_tracker = notebook_tracker;
    ContextManager.context();
}

