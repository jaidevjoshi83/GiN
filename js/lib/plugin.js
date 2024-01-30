import { IJupyterWidgetRegistry} from '@jupyter-widgets/base';
import { ILabShell, ILayoutRestorer } from "@jupyterlab/application";
import { INotebookTracker } from '@jupyterlab/notebook';
import { IMainMenu } from '@jupyterlab/mainmenu';
import {DataRegistry} from "@g2nb/nbtools/lib/dataregistry";
import { ToolRegistry } from '@g2nb/nbtools';
import { ContextManager } from '@g2nb/nbtools';
import * as galaxyuibuilder_exports from './Galaxyuibuilder';
import * as utils_exports from './utils'
import { MODULE_NAME, MODULE_VERSION } from './version';
import { NotebookActions } from '@jupyterlab/notebook';
import { Private,  getRanNotebookIds} from './notebookActions';


const module_exports = Object.assign(Object.assign(Object.assign(  {}, galaxyuibuilder_exports), utils_exports));

const EXTENSION_ID = 'GiN:plugin';
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

    const data_registry = new DataRegistry();
    const tool_registry = new ToolRegistry();
    // const data_registry = new DataRegistry();

    registry.registerWidget({
        name: 'GiN',
        version: '0.1.0',
        exports: module_exports,
    });
    return [tool_registry, data_registry]
}

function init_context(app, notebook_tracker) {
    ContextManager.jupyter_app = app;
    ContextManager.notebook_tracker = notebook_tracker;
    ContextManager.context();
    
    // ContextManager.PrivateData = Private
    // initNotebookTracker(notebook_tracker)  
}


function ReturnOutputArea(i, notebookTracker){
    // var RestorForm = `<div class="lm-Widget p-Widget jp-OutputArea jp-Cell-outputArea">
    //                     <div class="lm-Widget p-Widget lm-Panel p-Panel jp-OutputArea-child">
    //                         <div class="lm-Widget p-Widget jp-OutputPrompt jp-OutputArea-prompt"></div>
    //                         <div class="lm-Widget p-Widget lm-Panel p-Panel jupyter-widgets jp-OutputArea-output"><div id="restored_tool_form">${i}<div></div>
    //                     </div>
    //                 </div>`



    var RestorForm = `<div class="lm-Widget p-Widget lm-Panel p-Panel jp-OutputArea-child jp-OutputArea-executeResult" style="overflow: visible;">
                        <div class="lm-Widget p-Widget jp-OutputPrompt jp-OutputArea-prompt"></div>
                        <div class="lm-Widget p-Widget lm-Panel p-Panel jp-OutputArea-output" style="overflow: visible;">${i}</div>
                    </div>`       

    const utm = new DOMParser().parseFromString(RestorForm, 'text/html').querySelector('.lm-Widget.p-Widget.lm-Panel.p-Panel.jp-OutputArea-child')
    
    const notebook = notebookTracker.currentWidget.content
    const notebookHasBeenRan = getRanNotebookIds().includes(notebook.id)

    _.each(utm.querySelectorAll('.nbtools-run'), (e)=>{
        // e.innerText = "Update form for current user"
        e.style.display = 'none'
    })

    _.each(utm.querySelectorAll('#button-tool-refresh'), (e)=>{
        // e.innerText = "Update form for current user"

        e.addEventListener('click', async () => {

            e.parentNode.parentNode.parentNode.parentElement.removeChild(e.parentNode.parentNode.parentNode)

            const notebookContext = notebookTracker.currentWidget.context;
            const notebookSession = notebookTracker.currentWidget.context.sessionContext;

            notebookTracker.currentWidget.sessionContext.ready
                .then(() => notebookTracker.currentWidget.revealed)
                .then(() => {
                    NotebookActions.run(notebook, notebookSession);
                    const form  =  notebookTracker.currentWidget.content.activeCell.node.querySelector('.nbtools.galaxy-uibuilder.lm-Widget.p-Widget')
                    form.parentElement.removeChild(form)
                    form.style.display = 'none'
            });    
        })
    })

    return utm
}


const initNotebookTracker = (notebookTracker) => {

    const notebookHasBeenRan = getRanNotebookIds()

    notebookTracker.currentChanged.connect((notebookTracker, notebookPanel) => {
        if (!notebookTracker.currentWidget) {
            return;
        }
        const notebookContext = notebookTracker.currentWidget.context;

        notebookContext.ready.then(() => {

            const notebook = notebookTracker.currentWidget.content;
            const notebookSession = notebookTracker.currentWidget.context.sessionContext;
        
            if ( notebookHasBeenRan.includes(notebook.id) === false) {
            //FixME Form Restore insteed cell run

                Private.ranNotebookIds.push(notebook.id);
            
                notebookTracker.currentWidget.sessionContext.ready.then(() =>
                notebookTracker.currentWidget.revealed).then( () => {

                var cells = notebookTracker.currentWidget.content.widgets;

                for (var i = 0; i < cells.length; i++){
                    if (cells[i].model.metadata.get('galaxy_cell') ){
                        // ContextManager.context().run_cell(cells[i])
                        // notebook.activeCellIndex = i
                        // NotebookActions.run(notebook, notebookSession); 
                    }
                }
            });
            }
        });
    });
};