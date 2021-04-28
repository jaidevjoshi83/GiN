/**
 * Widget for representing Python output as an interactive interface
 *
 * @author Thorin Tabor
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */
import '../style/uioutput.css';
import { unpack_models } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { BaseWidgetModel, BaseWidgetView } from "./basewidget";
import { extract_file_name, extract_file_type, is_absolute_path, is_url } from './utils';
import { ContextManager } from "./context";
export class UIOutputModel extends BaseWidgetModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { _model_name: UIOutputModel.model_name, _model_module: UIOutputModel.model_module, _model_module_version: UIOutputModel.model_module_version, _view_name: UIOutputModel.view_name, _view_module: UIOutputModel.view_module, _view_module_version: UIOutputModel.view_module_version, name: 'Python Results', description: '', status: '', files: [], text: '', visualization: '', appendix: undefined, extra_file_menu_items: {} });
    }
}
UIOutputModel.model_name = 'UIOutputModel';
UIOutputModel.model_module = MODULE_NAME;
UIOutputModel.model_module_version = MODULE_VERSION;
UIOutputModel.view_name = 'UIOutputView';
UIOutputModel.view_module = MODULE_NAME;
UIOutputModel.view_module_version = MODULE_VERSION;
UIOutputModel.serializers = Object.assign(Object.assign({}, BaseWidgetModel.serializers), { appendix: {
        deserialize: (value, manager) => unpack_models(value, manager)
    } });
export class UIOutputView extends BaseWidgetView {
    constructor() {
        super(...arguments);
        this.dom_class = 'nbtools-uioutput';
        this.traitlets = [...super.basics(), 'status', 'files', 'text', 'visualization'];
        this.renderers = {
            "description": this.render_description,
            "error": this.render_error,
            "info": this.render_info,
            "files": this.render_files,
            "visualization": this.render_visualization
        };
        this.body = `
        <div class="nbtools-description" data-traitlet="description"></div>
        <div class="nbtools-error" data-traitlet="error"></div>
        <div class="nbtools-info" data-traitlet="info"></div>
        <div class="nbtools-status" data-traitlet="status"></div>
        <div class="nbtools-files" data-traitlet="files"></div>
        <pre class="nbtools-text" data-traitlet="text"></pre>
        <div class="nbtools-visualization" data-traitlet="visualization"></div>
        <div class="nbtools-appendix"></div>`;
    }
    render() {
        super.render();
        // Add the child widgets
        this.attach_child_widget('.nbtools-appendix', 'appendix');
    }
    render_files(files, widget) {
        let to_return = '';
        files.forEach(path => {
            const name = extract_file_name(path);
            const type = extract_file_type(path);
            const path_prefix = UIOutputView.pick_path_prefix(path);
            to_return += `<a class="nbtools-file" href="${path_prefix}${path}" data-type="${type}" onclick="return false;">${name} <i class="fa fa-info-circle"></i></a>`;
            to_return += `<ul class="nbtools-menu nbtools-file-menu" style="display: none;"></ul>`;
        });
        setTimeout(() => widget.initialize_file_menus(widget), 100);
        return to_return;
    }
    render_visualization(visualization, widget) {
        // Function for toggling pop out menu item on or off
        function toggle_open_visualizer(hide) {
            const controls = widget.element.querySelector('.nbtools-controls');
            if (!controls)
                return; // Get the gear menu buttons at the top and protect against null
            // Toggle or set the Pop Out Visualizer menu option's visibility
            controls.querySelectorAll('.nbtools-menu > li').forEach((item) => {
                if (item.textContent.includes('Pop Out Visualizer')) {
                    if (hide)
                        item.style.display = 'none';
                    else
                        item.style.display = 'block';
                }
            });
        }
        // Hide or show the open visualizer menu option, depending on whether there is a visualization
        if (!visualization.trim())
            toggle_open_visualizer(true);
        else
            toggle_open_visualizer(false);
        // If URL, display an iframe
        if (is_url(visualization))
            return `<iframe class="nbtools-visualization-iframe" src="${visualization}"></iframe>`;
        // Otherwise, embed visualization as HTML
        else
            return visualization;
    }
    static pick_path_prefix(path) {
        if (is_url(path))
            return ''; // is a URL
        else if (is_absolute_path(path))
            return ''; // is an absolute
        else
            return 'files/' + ContextManager.context().notebook_path(); // is relative path
    }
    attach_menu_options() {
        // Attach the Open Visualizer gear option
        const visualizer_option = this.add_menu_item('Pop Out Visualizer', () => this.open_visualizer());
        visualizer_option.style.display = this.model.get('visualization').trim() ? 'block' : 'none';
        // Call the base widget's attach_menu_options()
        super.attach_menu_options();
    }
    open_visualizer() {
        window.open(this.model.get('visualization'));
    }
    initialize_file_menus(widget) {
        const files = widget.el.querySelectorAll('.nbtools-file');
        files.forEach((link) => {
            link.addEventListener("click", function () {
                widget.toggle_file_menu(link);
            });
        });
    }
    initialize_menu_items(link) {
        const menu = link.nextElementSibling;
        if (!menu)
            return; // Protect against null
        const type = link.getAttribute('data-type');
        const href = link.getAttribute('href');
        const file_name = link.textContent ? link.textContent.trim() : href;
        const widget_name = this.model.get('name');
        // Add the send to options
        this.get_input_list(type).forEach(input => {
            this.add_menu_item(input['name'] + ' -> ' + input['param'], () => {
                const form_input = input['element'].querySelector('input');
                form_input.value = href;
                form_input.dispatchEvent(new Event('change', { bubbles: true }));
                const widget = form_input.closest('.nbtools');
                widget.scrollIntoView();
            }, 'nbtools-menu-subitem', menu);
        });
        // Add send to header
        this.add_menu_item('Send to...', () => { }, 'nbtools-menu-header', menu);
        // Add the extra menu items
        const menu_items = this.model.get('extra_file_menu_items');
        const template_vars = {
            'widget_name': widget_name,
            'file_name': file_name,
            'type': type
        };
        Object.keys(menu_items).forEach((name) => {
            const item = menu_items[name];
            // Skip if this file doesn't match any type restrictions
            if (item['kinds'] && Array.isArray(item['kinds']) && !item['kinds'].includes(type))
                return;
            // Create the callback and attach the menu item
            const callback = this.create_menu_callback(item, template_vars);
            this.add_menu_item(name, callback, 'nbtools-menu-subitem', menu);
        });
        // Add download and new tab options
        this.add_menu_item('Download', () => window.open(link.getAttribute('href') + '?download=1'), '', menu);
        this.add_menu_item('Open in New Tab', () => window.open(link.getAttribute('href')), '', menu);
    }
    toggle_file_menu(link) {
        const menu = link.nextElementSibling;
        const collapsed = menu.style.display === "none";
        // Build the menu lazily
        menu.innerHTML = ''; // Clear all existing children
        this.initialize_menu_items(link);
        // Hide or show the menu
        if (collapsed)
            menu.style.display = "block";
        else
            menu.style.display = "none";
        // Hide the menu with the next click
        const hide_next_click = function (event) {
            if (link.contains(event.target))
                return;
            menu.style.display = "none";
            document.removeEventListener('click', hide_next_click);
        };
        document.addEventListener('click', hide_next_click);
    }
    get_input_list(type) {
        // Get the notebook's parent node
        const notebook = this.el.closest('.jp-Notebook');
        // Get all possible outputs
        const parameters = [...notebook.querySelectorAll('.nbtools-menu-attached')];
        // Build list of compatible inputs
        const compatible_inputs = [];
        parameters.forEach((input) => {
            // Ignore hidden parameters
            if (input.offsetWidth === 0 && input.offsetHeight === 0)
                return;
            // Ignore incompatible inputs
            const kinds = input.getAttribute('data-type') || '';
            const param_name = input.getAttribute('data-name') || '';
            const kinds_list = kinds.split(', ');
            if (!kinds_list.includes(type) && kinds !== '')
                return;
            // Add the input to the compatible list
            const widget_element = input.closest('.nbtools');
            let name = widget_element.querySelector('.nbtools-title').textContent;
            if (!name)
                name = "Untitled Widget";
            compatible_inputs.push({
                'name': name,
                'param': param_name,
                'element': input
            });
        });
        return compatible_inputs;
    }
}