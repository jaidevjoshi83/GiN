import {ToolRegistry } from '@g2nb/nbtools';
import {ContextManager} from '@g2nb/nbtools'


export class GalaxyToolRegistry extends ToolRegistry {

    constructor() {
        super()

        // this._update_callbacks = []; // Functions to call when an update happens
        this.kernel_galaxy_tool_cache = {}; // Keep a cache of kernels to registered tools
        // this.kernel_import_cache = {}; // Keep a cache of whether nbtools has been imported

        if (!ContextManager.galaxy_tool_registry)
            ContextManager.galaxy_tool_registry = this;
            ContextManager.context().notebook_focus((current_widget) => {
            // Current notebook hasn't changed, no need to do anything, return
            if (this.current === current_widget)
                return;
            // Otherwise, update the current notebook reference
            this.current = current_widget;
            // If the current selected widget isn't a notebook, no comm is needed
            if (!(this.current instanceof NotebookPanel) && ContextManager.is_lab())
                return;
            // Initialize the comm
            this.init_comm();
            // Load the default tools
        this.import_default_tools();
    });
    }
} 