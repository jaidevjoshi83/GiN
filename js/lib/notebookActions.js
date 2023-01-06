import { CodeCell } from '@jupyterlab/cells';
import { NotebookActions } from '@jupyterlab/notebook';
const getMetadata = (notebook) => {
    const meta = notebook.model.metadata.get('GiN');
    return meta;
};
const setMetadata = (notebook, metadata) => {
    const meta = notebook.model.metadata.set('GiN', metadata);
    return meta;
};
const hideCodeCells = (notebook, force = false) => {
    notebook.widgets
        .filter((cell) => cell instanceof CodeCell && cell.inputArea.isHidden === false)
        .forEach((cell) => {
        cell.inputArea.hide();
    });
    if (force === true) {
        Private.forcedCellsVisibleNotebookIds = Private.forcedCellsVisibleNotebookIds.filter((id) => id !== notebook.id);
    }
};
const showCodeCells = (notebook) => {
    notebook.widgets
        .filter((cell) => cell instanceof CodeCell)
        .filter((cell) => cell.inputArea.isHidden === true)
        .forEach((cell) => {
        cell.inputArea.show();
    });
    if (Private.forcedCellsVisibleNotebookIds.includes(notebook.id) === false) {
        Private.forcedCellsVisibleNotebookIds.push(notebook.id);
        // Listening to notebook close event so we can remove it from the list of 'forced cells visible' ones 
        notebook.disposed.connect((notebook) => {
            Private.forcedCellsVisibleNotebookIds = Private.forcedCellsVisibleNotebookIds.filter((id) => id !== notebook.id);
        });
    }
};
const runAllCells = (notebook, notebookSession) => {
    NotebookActions.runAll(notebook, notebookSession);
    if (Private.ranNotebookIds.includes(notebook.id) === false) {
        Private.ranNotebookIds.push(notebook.id);
        // Listening to notebook close event so we can remove it from the list of ran ones 
        notebook.disposed.connect((notebook) => {
            Private.ranNotebookIds = Private.ranNotebookIds.filter((id) => id !== notebook.id);
        });
    }
};
const getRanNotebookIds = () => {
    return Private.ranNotebookIds;
};
const getForcedCellsVisibleNotebookIds = () => {
    return Private.forcedCellsVisibleNotebookIds;
};
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    Private.ranNotebookIds = [];
    Private.forcedCellsVisibleNotebookIds = [];
})(Private || (Private = {}));
export { getMetadata, setMetadata, hideCodeCells, showCodeCells, runAllCells, getRanNotebookIds, getForcedCellsVisibleNotebookIds };
