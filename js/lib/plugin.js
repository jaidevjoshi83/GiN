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

import { getForcedCellsVisibleNotebookIds, getMetadata, getRanNotebookIds, hideCodeCells, runAllCells, setMetadata, showCodeCells } from './notebookActions';
const module_exports = Object.assign(Object.assign(Object.assign({},  galaxyuibuilder_exports), utils_exports));

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

    initNotebookTracker(notebook_tracker)
    notebook_tracker
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
        e.innerText = "Restore form state"

        e.addEventListener('click', async () => {

                console.log(notebookHasBeenRan)

                if ( notebookHasBeenRan === false) {

                
                const notebookContext = notebookTracker.currentWidget.context;
                const notebookSession = notebookTracker.currentWidget.context.sessionContext;

                        notebookTracker.currentWidget.sessionContext.ready
                            .then(() => notebookTracker.currentWidget.revealed)
                            .then(() => {
                                NotebookActions.run(notebook, notebookSession);
                        });
                        // console.log(cells[2].model.metadata.get('html'))

                // NotebookActions.run(notebookContext, notebookSession)
                e.parentNode.parentNode.parentNode.parentNode.parentNode.parentElement.removeChild(e.parentNode.parentNode.parentNode.parentNode.parentNode)
                // try{
                //     await NotebookActions.run(notebookContext, notebookSession);
                // } catch(error){
                //     console.log(reject(error));
                // } 
            }
        })
    })

    return utm
}

// const initNotebookTracker =  (notebookTracker) => {
//     // await KernelSideDataObjects('import GiN.authwidget')
//     console.log("OK")
//     notebookTracker.currentChanged.connect((notebookTracker) => {
//         if (!notebookTracker.currentWidget) {
//             return;
//         }
//         const notebook = notebookTracker.currentWidget.content;
        
//         // notebook.sessionContext.session.kernel.requestExecute({ 'code': "import GiN\nimport GiN.authwidget", 'stop_on_error' : true});

//         const notebookContext = notebookTracker.currentWidget.context;
//         const notebookSession = notebookTracker.currentWidget.context.sessionContext;
//         // This runs every time user displays the notebook (even when swapping tabs)
//         notebookContext.ready.then(() => {
//             var cells = notebookTracker.currentWidget.content.widgets;

//             const notebookHasBeenRan = getRanNotebookIds().includes(notebook.id)

//             console.log(notebookHasBeenRan)

//             if ( notebookHasBeenRan === false) {
//                 for (var i = 0; i < cells.length; i++){
//                     // console.log(cells[i].model.metadata.get('html'))
//                     if(cells[i].model.metadata.get('html') != undefined){
//                         console.log("OK")
//                         removeAllChildNodes(cells[i].outputArea.node)
//                         cells[i].outputArea.node.append(ReturnOutputArea(cells[i].model.metadata.get('html'), notebookTracker))
//                     }
//                 }
//             }
//         });
//     });
// };


const initNotebookTracker = (notebookTracker) => {

    console.log(notebookTracker)
    notebookTracker.currentChanged.connect((notebookTracker, notebookPanel) => {
        if (!notebookTracker.currentWidget) {
            return;
        }
        const notebook = notebookTracker.currentWidget.content;
        const notebookContext = notebookTracker.currentWidget.context;
        const notebookSession = notebookTracker.currentWidget.context.sessionContext;
        // This runs every time user displays the notebook (even when swapping tabs)
        notebookContext.ready.then(() => {
            console.log("OK!")

            // Checking if user ran 'show code cells' command
            // const notebookCellsForcedVisible = getForcedCellsVisibleNotebookIds().includes(notebook.id);
            // if (notebookMetadata.hideCodeCells === true && notebookCellsForcedVisible === false) {
            //     hideCodeCells(notebook);
            // }
            // Run all cells only once
            const notebookHasBeenRan = getRanNotebookIds().includes(notebook.id);

            var cells = notebookTracker.currentWidget.content.widgets;
            if ( notebookHasBeenRan === false) {

                console.log("OK")
                // notebookTracker.currentWidget.sessionContext.ready
                //     .then(() => notebookTracker.currentWidget.revealed)
                //     .then(() => {
                //     runAllCells(notebook, notebookSession);
                // });

                for (var i = 0; i < cells.length; i++){
                     // console.log(cells[i].model.metadata.get('html'))
                     if(cells[i].model.metadata.get('html') != undefined){
                         console.log("OK")
                         removeAllChildNodes(cells[i].outputArea.node)
                         cells[i].outputArea.node.append(ReturnOutputArea(cells[i].model.metadata.get('html'), notebookTracker))
                     }
                 }
            }
        });
    });
};