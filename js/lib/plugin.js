import { IJupyterWidgetRegistry} from '@jupyter-widgets/base';
import { ILabShell, ILayoutRestorer } from "@jupyterlab/application";
import { INotebookTracker } from '@jupyterlab/notebook';
import { IMainMenu } from '@jupyterlab/mainmenu';
import {DataRegistry} from "@g2nb/nbtools/lib/dataregistry";
import { ToolRegistry } from '@g2nb/nbtools';
// import { ContextManager } from '@g2nb/nbtools';
import { ContextManager } from '@g2nb/nbtools/lib/context';
import * as galaxyuibuilder_exports from './Galaxyuibuilder';
import * as utils_exports from './utils'
import { MODULE_NAME, MODULE_VERSION } from './version';
import { removeAllChildNodes , KernelSideDataObjects} from './utils';
import { NotebookActions } from '@jupyterlab/notebook';


// import {refresh_cells} from './Galaxyuibuilder';

import {  Widget } from '@lumino/widgets';

import { Private,  getRanNotebookIds} from './notebookActions';
import { type } from 'jquery';
const module_exports = Object.assign(Object.assign(Object.assign(   {}, galaxyuibuilder_exports), utils_exports));

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

    // const data_registry = new DataRegistry();
    const tool_registry = new ToolRegistry();
    const data_registry = new DataRegistry();

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
    notebook_tracker

    initNotebookTracker(notebook_tracker)
    
}

function ReturnOutputArea(i, notebookTracker){
    var RestorForm = `<div class="lm-Widget p-Widget lm-Panel p-Panel jp-OutputArea-child">
                        <div class="lm-Widget p-Widget jp-OutputPrompt jp-OutputArea-prompt"></div>
                        <div class="lm-Widget p-Widget lm-Panel p-Panel jupyter-widgets jp-OutputArea-output">${i}</div>
                    </div>`

                    const utm = new DOMParser().parseFromString(RestorForm, 'text/html').querySelector('.lm-Widget.p-Widget.lm-Panel.p-Panel.jp-OutputArea-child')
    
    const notebook = notebookTracker.currentWidget.content
    const notebookHasBeenRan = getRanNotebookIds().includes(notebook.id)

    _.each(utm.querySelectorAll('.nbtools-run'), (e)=>{
        e.innerText = "Update form for current user"

        e.addEventListener('click', async () => {
            // if ( notebookHasBeenRan === false) {

                console.log("OK")

                const notebookContext = notebookTracker.currentWidget.context;
                const notebookSession = notebookTracker.currentWidget.context.sessionContext;

                notebookTracker.currentWidget.sessionContext.ready
                    .then(() => notebookTracker.currentWidget.revealed)
                    .then(() => {
                        NotebookActions.run(notebook, notebookSession);
                });
                e.parentNode.parentNode.parentNode.parentNode.parentNode.parentElement.removeChild(e.parentNode.parentNode.parentNode.parentNode.parentNode)
            // }
        })
    })

    return utm
}

const initNotebookTracker = (notebookTracker) => {
    const notebookHasBeenRan = getRanNotebookIds();

    notebookTracker.currentChanged.connect(async (notebookTracker, notebookPanel) => {
        const currentWidget = notebookTracker.currentWidget;

        if (!currentWidget) {
            return;
        }

        const notebookContext = currentWidget.context;
        await notebookContext.ready;

        const notebook = currentWidget.content;
        const notebookSession = currentWidget.context.sessionContext;

        const notebookId = notebook.id;

        if (!notebookHasBeenRan.includes(notebookId)) {
            Private.ranNotebookIds.push(notebookId);

            await currentWidget.sessionContext.ready;
            await currentWidget.revealed;

            const cells = currentWidget.content.widgets;

            for (const cell of cells) {
                if (cell.model.metadata.get('galaxy_cell')) {
                    const htmlMetadata = cell.model.metadata.get('html');

                    if (htmlMetadata == null || htmlMetadata === '') {
                        removeAllChildNodes(cell.outputArea.node);
                        notebook.activeCellIndex = cells.indexOf(cell);
                        await NotebookActions.run(notebook, notebookSession);
                    } else if (typeof htmlMetadata === 'string') {
                        removeAllChildNodes(cell.outputArea.node);
                        cell.outputArea.node.append(ReturnOutputArea(htmlMetadata, notebookTracker));
                    }
                }
            }
        }
    });
};

// const initNotebookTracker = (notebookTracker) => {

//     const notebookHasBeenRan = getRanNotebookIds()

//     notebookTracker.currentChanged.connect((notebookTracker, notebookPanel) => {
//         if (!notebookTracker.currentWidget) {
//             return;
//         }
//         const notebookContext = notebookTracker.currentWidget.context;

//         notebookContext.ready.then(() => {

//             const notebook = notebookTracker.currentWidget.content;
//             const notebookSession = notebookTracker.currentWidget.context.sessionContext;
        
//             if ( notebookHasBeenRan.includes(notebook.id) === false) {
//             //FixME Form Restore insteed cell run

//                 Private.ranNotebookIds.push(notebook.id);
            
//                 notebookTracker.currentWidget.sessionContext.ready.then(() =>
//                 notebookTracker.currentWidget.revealed).then(async () => {

//                 var cells = notebookTracker.currentWidget.content.widgets;

//                 for (var i = 0; i < cells.length; i++){
//                     console.log()


//                     if (cells[i].model.metadata.get('galaxy_cell') ){

//                         if (cells[i].model.metadata.get('html') == undefined || cells[i].model.metadata.get('html') == '') {
//                             removeAllChildNodes(cells[i].outputArea.node)
//                             notebook.activeCellIndex = i
//                             await NotebookActions.run(notebook, notebookSession);            
                       
//                         } 
//                         else{
//                             // cells[i].inputArea.hide()
                            
                        
//                             if((typeof cells[i].model.metadata.get('html')) == String ) {
//                                 // cells[i].model

//                                 removeAllChildNodes(cells[i].outputArea.node)
//                                 cells[i].outputArea.node.append(ReturnOutputArea(cells[i].model.metadata.get('html'), notebookTracker))
//                             }

//                         }
//                     }
//                  }
//             });

//             }
//         });
//     });
// };