import { PanelLayout, Widget } from '@lumino/widgets';
import { toggle } from "./utils";
import { ContextManager } from "./context";
import { NotebookActions, NotebookPanel } from "@jupyterlab/notebook";
export class GalaxyToolBrowser extends Widget {
    constructor() {
        super();
        this.search = null;
        this.toolbox = null;
        this.addClass('galaxy-browser');
        this.layout = new PanelLayout();
        this.search = new SearchBox();
        this.toolbox = new GalaxyToolbox(this.search);
        this.layout.addWidget(this.search);
        this.layout.addWidget(this.toolbox);
    }
}
export class GalaxyToolbox extends Widget {
    constructor(associated_search) {
        super();
        this.last_update = 0;
        this.update_waiting = false;
        this.search = associated_search;
        this.addClass('galaxy-toolbox');
        this.addClass('galaxy-wrapper');

        // Update the toolbox when the tool registry changes
        ContextManager.galaxy_tool_registry.on_update(() => {
            // If the last update was more than 10 seconds ago, update the toolbox
            if (this.update_stale())
                this.fill_toolbox();
            else
                this.queue_update(); // Otherwise, queue an update if not already waiting for one
        });
        // Fill the toolbox with the registered tools
        this.fill_toolbox();
    }
    update_stale() {
        return this.last_update + (3 * 1000) < Date.now();
    }
    queue_update() {
        // If no update is waiting, queue an update
        if (!this.update_waiting) {
            setTimeout(() => {
                this.fill_toolbox(); // Fill the toolbox
                this.update_waiting = false; // And mark as no update queued
            }, Math.abs(this.last_update + (3 * 1000) - Date.now())); // Queue for 3 seconds since last update
            this.update_waiting = true; // And mark as queued
        }
    }
    static add_tool_cell(tool) {
        // Check to see if nbtools needs to be imported
        const import_line = ContextManager.galaxy_tool_registry.needs_import() ? 'import GiN\n\n' : '';
        // Add and run a code cell with the generated tool code
        GalaxyToolbox.add_code_cell(import_line + `GiN.tool(id='${tool.id}', origin='${tool.origin}')`);
    }
    static add_code_cell(code) {
        if (!ContextManager.notebook_tracker)
            return; // If no NotebookTracker, do nothing
        const current = ContextManager.galaxy_tool_registry.current;
        if (!current || !(current instanceof NotebookPanel))
            return; // If no notebook is currently selected, return
        let cell = ContextManager.notebook_tracker.activeCell;
        if (!cell)
            return; // If no cell is selected, do nothing
        // If the currently selected cell isn't empty, insert a new one below and select it
        const current_cell_code = cell.model.value.text.trim();
        if (!!current_cell_code)
            NotebookActions.insertBelow(current.content);
        // Fill the cell with the tool's code
        cell = ContextManager.notebook_tracker.activeCell; // The active cell may just have been updated
        if (cell)
            cell.model.value.text = code;
        // Run the cell
        return NotebookActions.run(current.content, current.context.sessionContext);
    }
    fill_toolbox() {
        this.last_update = Date.now();
  
        // First empty the toolbox
        this.empty_toolbox();
        // Get the list of tools
        const tools = ContextManager.galaxy_tool_registry.list();
        // Organize by origin and sort
        const organized_tools = this.organize_tools(tools);

        console.log(organized_tools)

        const origins = Object.keys(organized_tools);
        origins.sort((a, b) => {
            const a_name = a.toLowerCase();
            const b_name = b.toLowerCase();
            return (a_name < b_name) ? -1 : (a_name > b_name) ? 1 : 0;
        });
        // Add each origin
        origins.forEach((origin) => {
            const origin_box = this.add_origin(origin);
            organized_tools[origin].forEach((tool) => {
                this.add_tool(origin_box, tool);
            });
        });
        // Apply search filter after refresh
        this.search.filter(this.search.node.querySelector('input.nbtools-search'));
    }
    organize_tools(tool_list) {
        const organized = {};
        // Group tools by origin
        tool_list.forEach((tool) => {
            if (tool.origin in organized)
                organized[tool.origin].push(tool); // Add tool to origin
            else
                organized[tool.origin] = [tool]; // Lazily create origin
        });
        // Sort the tools in each origin
        Object.keys(organized).forEach((origin) => {
            organized[origin].sort((a, b) => {
                const a_name = a.name.toLowerCase();
                const b_name = b.name.toLowerCase();
                return (a_name < b_name) ? -1 : (a_name > b_name) ? 1 : 0;
            });
        });
        // Return the organized set of notebooks
        return organized;
    }
    empty_toolbox() {
        this.node.innerHTML = '';
    }
    add_origin(name) {
        // Create the HTML DOM element
        const origin_wrapper = document.createElement('div');
        origin_wrapper.innerHTML = `
            <header class="nbtools-origin" title="${name}">
                <span class="nbtools-expanded nbtools-collapse jp-Icon jp-Icon-16 jp-ToolbarButtonComponent-icon"></span>
                ${name}
            </header>
            <ul class="nbtools-origin" title="${name}"></ul>`;
        // Attach the expand / collapse functionality
        const collapse = origin_wrapper.querySelector('span.nbtools-collapse');
        collapse.addEventListener("click", () => this.toggle_collapse(origin_wrapper));
        // Add to the toolbox
        this.node.append(origin_wrapper);
        return origin_wrapper;
    }
    add_tool(origin, tool) {
        const list = origin.querySelector('ul');
        const tool_wrapper = document.createElement('li');
        tool_wrapper.classList.add('nbtools-tool');
        tool_wrapper.setAttribute('title', 'Click to add to notebook');
        tool_wrapper.innerHTML = `
            <div class="nbtools-add">+</div>
            <div class="nbtools-header">${tool.name}</div>
            <div class="nbtools-description">${tool.description}</div>`;
        if (list)
            list.append(tool_wrapper);
        // Add the click event
        tool_wrapper.addEventListener("click", () => {
            GalaxyToolbox.add_tool_cell(tool);
        });
    }
    toggle_collapse(origin_wrapper) {
        const list = origin_wrapper.querySelector("ul.nbtools-origin");
        const collapsed = list.classList.contains('nbtools-hidden');
        // Toggle the collapse button
        const collapse = origin_wrapper.querySelector('span.nbtools-collapse');
        if (collapsed) {
            collapse.classList.add('nbtools-expanded');
            collapse.classList.remove('nbtools-collapsed');
        }
        else {
            collapse.classList.remove('nbtools-expanded');
            collapse.classList.add('nbtools-collapsed');
        }
        // Hide or show widget body
        toggle(list);
    }
}
export class SearchBox extends Widget {
    constructor() {
        super();
        this.value = '';
        this.node.innerHTML = `
            <div class="nbtools-wrapper">
                <div class="nbtools-outline">
                    <input type="search" class="nbtools-search" spellcheck="false" placeholder="SEARCH" />
                </div>
            </div>
        `;
        this.attach_events();
    }
    attach_events() {
        // Attach the change event to the search box
        const search_box = this.node.querySelector('input.nbtools-search');
        search_box.addEventListener("keyup", () => this.filter(search_box));
    }
    filter(search_box) {
        // Update the value state
        this.value = search_box.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Get the toolbox
        const toolbox = document.querySelector('#nbtools-browser > .nbtools-toolbox');
        if (!toolbox)
            return; // Do nothing if the toolbox is null
        // Show any tool that matches and hide anything else
        toolbox.querySelectorAll('li.nbtools-tool').forEach((tool) => {
            if (tool.textContent.toLowerCase().replace(/[^a-z0-9]/g, '').includes(this.value))
                tool.style.display = 'block';
            else
                tool.style.display = 'none';
        });
    }
}
