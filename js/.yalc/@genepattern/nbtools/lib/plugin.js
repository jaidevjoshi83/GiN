import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import * as base_exports from './basewidget';
import * as uioutput_exports from './uioutput';
import * as uibuilder_exports from './uibuilder';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ToolBrowser, Toolbox } from "./toolbox";
import { ToolRegistry } from "./registry";
import { pulse_red } from "./utils";
import { ILabShell, ILayoutRestorer } from "@jupyterlab/application";
import { INotebookTracker } from '@jupyterlab/notebook';
import { ContextManager } from "./context";
const documentation = 'nbtools:documentation';
const module_exports = Object.assign(Object.assign(Object.assign({}, base_exports), uioutput_exports), uibuilder_exports);
const EXTENSION_ID = '@genepattern/nbtools:plugin';
const NAMESPACE = 'nbtools';
/**
 * The nbtools plugin.
 */
const nbtools_plugin = {
    id: EXTENSION_ID,
    // provides: IToolRegistry,
    requires: [IJupyterWidgetRegistry],
    optional: [IMainMenu, ILayoutRestorer, ILabShell, INotebookTracker],
    activate: activate_widget_extension,
    autoStart: true
};
export default nbtools_plugin;
/**
 * Activate the widget extension.
 */
function activate_widget_extension(app, widget_registry, mainmenu, restorer, shell, notebook_tracker) {
    // Initialize the ContextManager
    init_context(app, notebook_tracker);
    // Create the tool registry
    const tool_registry = new ToolRegistry();
    // Add items to the help menu
    add_documentation_link(app, mainmenu);
    // Add keyboard shortcuts
    add_keyboard_shortcuts(app, tool_registry);
    // Add the toolbox
    add_tool_browser(app, restorer);
    // Register the nbtools widgets with the widget registry
    widget_registry.registerWidget({
        name: MODULE_NAME,
        version: MODULE_VERSION,
        exports: module_exports,
    });
    // Return the tool registry so that it is provided to other extensions
    return tool_registry;
}
function init_context(app, notebook_tracker) {
    ContextManager.jupyter_app = app;
    ContextManager.notebook_tracker = notebook_tracker;
    ContextManager.context();
    //(window as any).ContextManager = ContextManager;  // Left in for development purposes
}
function add_keyboard_shortcuts(app, tool_registry) {
    app.commands.addCommand("nbtools:insert-tool", {
        label: 'Insert Notebook Tool',
        execute: () => {
            // Open the tool manager, if necessary
            app.shell.activateById('nbtools-browser');
            pulse_red(document.getElementById('nbtools-browser'));
            // If only one tool is available, add it
            const tools = tool_registry.list();
            if (tools.length === 1)
                Toolbox.add_tool_cell(tools[0]);
            // Otherwise give the search box focus
            else
                document.querySelector('.nbtools-search').focus();
        },
    });
}
function add_tool_browser(app, restorer) {
    const tool_browser = new ToolBrowser();
    tool_browser.title.iconClass = 'nbtools-icon fa fa-th jp-SideBar-tabIcon';
    tool_browser.title.caption = 'Toolbox';
    tool_browser.id = 'nbtools-browser';
    // Add the tool browser widget to the application restorer
    if (restorer)
        restorer.add(tool_browser, NAMESPACE);
    app.shell.add(tool_browser, 'left', { rank: 102 });
}
/**
 * Add the nbtools documentation link to the help menu
 *
 * @param {Application<Widget>} app
 * @param {IMainMenu} mainmenu
 */
function add_documentation_link(app, mainmenu) {
    // Add documentation command to the command palette
    app.commands.addCommand(documentation, {
        label: 'nbtools Documentation',
        caption: 'Open documentation for nbtools',
        isEnabled: () => !!app.shell,
        execute: () => {
            const url = 'https://github.com/genepattern/nbtools#nbtools';
            let element = document.createElement('a');
            element.href = url;
            element.target = '_blank';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            return void 0;
        }
    });
    // Add documentation link to the help menu
    if (mainmenu)
        mainmenu.helpMenu.addGroup([{ command: documentation }], 2);
}
