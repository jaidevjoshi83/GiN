import '../style/basewidget.css';
import { ContextManager } from "./context";
import { process_template, toggle } from "./utils";
import { DOMWidgetModel, DOMWidgetView, reject } from "@jupyter-widgets/base";
import { MODULE_NAME, MODULE_VERSION } from "./version";
import { Toolbox } from "./toolbox";
export class BaseWidgetModel extends DOMWidgetModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { name: '', description: '', collapsed: false, color: 'var(--jp-layout-color4)', logo: ContextManager.context().default_logo(), info: '', error: '', extra_menu_items: {} });
    }
}
BaseWidgetModel.model_name = 'BaseWidgetModel';
BaseWidgetModel.model_module = MODULE_NAME;
BaseWidgetModel.model_module_version = MODULE_VERSION;
BaseWidgetModel.view_name = 'BaseWidgetView';
BaseWidgetModel.view_module = MODULE_NAME;
BaseWidgetModel.view_module_version = MODULE_VERSION;
BaseWidgetModel.serializers = Object.assign({}, DOMWidgetModel.serializers);
export class BaseWidgetView extends DOMWidgetView {
    constructor() {
        super(...arguments);
        this.dom_class = '';
        this.element = document.createElement('div');
        this.traitlets = ['name', 'description', 'info', 'error'];
        this.renderers = {
            "description": this.render_description,
            "error": this.render_error,
            "info": this.render_info
        };
        this.template = `<div class="nbtools">
                           <div class="nbtools-header"></div>
                           <div class="nbtools-body"></div>
                       </div>`;
        this.header = `<img class="nbtools-logo" src="" />
                     <label class="nbtools-title" data-traitlet="name"></label>
                     <div class="nbtools-controls">
                         <button class="nbtools-collapse">
                             <span class="fa fa-minus"></span>
                         </button>
                         <button class="nbtools-gear">
                             <span class="fa fa-cog"></span>
                             <span class="fa fa-caret-down"></span>
                         </button>
                         <ul class="nbtools-menu" style="display: none;"></ul>
                     </div>`;
        this.body = `<div class="nbtools-description" data-traitlet="description"></div>
                   <div class="nbtools-error" data-traitlet="error"></div>
                   <div class="nbtools-info" data-traitlet="info"></div>`;
        this.disconnected = `<div class="nbtools-disconnected">
                               <div class="nbtools-panel">
                                   <div class="nbtools-header">Widget Disconnected From Kernel</div>
                                   <div class="nbtools-body">
                                       <p>You need to run this cell before it can connect to the notebook kernel. Please click the Connect to Kernel button below.</p>
                                       <div class="nbtools-connect"><button class="nbtools-connect">Connect to Kernel</button></div>
                                   </div>
                               </div>
                           </div>`;
    }
    render() {
        super.render();
        // Build the widget
        this.build();
        // Apply the color
        this.set_color();
        this.model.on('change:color', this.set_color, this);
        // Apply the logo
        this.set_logo();
        this.model.on('change:logo', this.set_logo, this);
        // Set the traitlet values
        this.traitlets.forEach(traitlet => this.traitlet_changed(traitlet));
        // Hook in the traitlet change events
        this.traitlets.forEach(traitlet => this.model.on(`change:${traitlet}`, this.traitlet_changed, this));
        // Hook in the expand / collapse events
        this.model.on('change:collapsed', this.toggle_collapse, this);
        if (this.model.get('collapsed'))
            this.toggle_collapse();
        // Hide the code
        this.toggle_code(false);
        // Attach the extra menu options
        this.attach_menu_options();
        // Allow menus to overflow the container
        this.float_menus();
        // Initialize the widget
        this.initialize({ options: {} });
        // Call any post render events
        this.post_render();
    }
    build() {
        // Parse the template
        this.element = new DOMParser().parseFromString(this.template, "text/html")
            .querySelector('div.nbtools');
        // Apply the DOM class
        if (this.dom_class)
            this.element.classList.add(this.dom_class);
        // Apply the header
        this.element.querySelector('div.nbtools-header').innerHTML = this.header;
        // Attach collapse event
        const collapse = this.element.querySelector("button.nbtools-collapse");
        collapse.addEventListener("click", () => {
            this.model.set('collapsed', !this.model.get('collapsed'));
            this.model.save_changes();
        });
        // Attach the gear event
        const gear = this.element.querySelector("button.nbtools-gear");
        gear.addEventListener("click", () => this.toggle_menu());
        // Attach toggle code event
        this.add_menu_item('Toggle Code View', () => this.toggle_code());
        // Apply the body
        this.element.querySelector('div.nbtools-body').innerHTML = this.body;
        // Attach the disconnected cover
        this.element.appendChild(new DOMParser().parseFromString(this.disconnected, "text/html")
            .querySelector('body > :first-child'));
        this.attach_connect_event();
        this.disconnected_sync_fix();
        // Set the element
        this.setElement(this.element);
    }
    set_logo() {
        // Get custom logo
        let logo = this.model.get('logo');
        // Fall back to default logo if no custom logo is set
        if (!logo) {
            logo = ContextManager.context().default_logo();
            this.model.set('logo', logo);
            this.model.save();
        }
        // Display the logo on the widget
        const logo_element = this.element.querySelector("img.nbtools-logo");
        logo_element.src = logo;
    }
    set_color() {
        const color = this.model.get('color').trim();
        this.element.style.borderColor = color;
        this.element.querySelectorAll('.nbtools-body button, .nbtools-header').forEach((e) => {
            e.style.backgroundColor = color;
        });
    }
    render_description(description, widget) {
        return widget._render_or_hide('.nbtools-description', description, widget);
    }
    render_error(message, widget) {
        return widget._render_or_hide('.nbtools-error', message, widget);
    }
    render_info(message, widget) {
        return widget._render_or_hide('.nbtools-info', message, widget);
    }
    _render_or_hide(selector, message, widget) {
        widget.element.querySelector(selector).style.display = message.trim() ? 'block' : 'none';
        return message;
    }
    attach_connect_event() {
        const button = this.element.querySelector('button.nbtools-connect');
        button.addEventListener("click", () => {
            // Run all cells with disconnected nbtools widgets
            ContextManager.context().run_tool_cells();
        });
    }
    disconnected_sync_fix() {
        // Fix a bug that can occur when a disconnected widget and a connected widget are somehow rendered in the same cell
        setTimeout(() => {
            const cell = this.element.closest('.jp-Cell, .cell');
            if (!cell)
                return; // No cell found, bug cannot occur
            // Do both connected and disconnected widgets appear in the cell?
            const contains_disconnected = !!cell.querySelectorAll('.nbtools.jupyter-widgets-disconnected').length;
            const contains_connected = !!cell.querySelectorAll('.nbtools:not(.jupyter-widgets-disconnected)').length;
            // If they do, hide the irrelevant disconnected widgets
            if (contains_disconnected && contains_connected) {
                cell.querySelectorAll('.nbtools.jupyter-widgets-disconnected').forEach((e) => {
                    e.style.display = 'none';
                });
            }
        }, 100);
    }
    add_menu_item(label, callback, dom_class = null, menu = null, prepend = true) {
        // Create the menu item
        const item = new DOMParser().parseFromString(`<li>${label}</li>`, "text/html")
            .querySelector('li');
        // Apply the class if one is specified
        if (dom_class)
            item.classList.add(dom_class);
        // Attach the menu item
        if (!menu)
            menu = this.element.querySelector('.nbtools-menu');
        if (prepend)
            menu.prepend(item);
        else
            menu.append(item);
        // Attach the click event
        item.addEventListener('click', () => callback());
        return item;
    }
    traitlet_changed(event) {
        const widget = this;
        const name = typeof event === "string" ? event : Object.keys(event.changed)[0];
        const elements = this.element.querySelectorAll(`[data-traitlet=${name}]`);
        elements.forEach(element => {
            if (name in this.renderers)
                element.innerHTML = this.renderers[name](this.model.get(name), widget);
            else
                element.innerHTML = this.model.get(name);
        });
    }
    toggle_code(display) {
        const element = this.element;
        ContextManager.context().toggle_code(element, display);
    }
    toggle_collapse() {
        const body = this.element.querySelector(".nbtools-body");
        const collapsed = body.style.display === "none";
        // Hide or show widget body
        toggle(body);
        // Toggle the collapse button
        const button = this.element.querySelector(".nbtools-collapse > span");
        if (collapsed) {
            button.classList.add('fa-minus');
            button.classList.remove('fa-plus');
        }
        else {
            button.classList.remove('fa-minus');
            button.classList.add('fa-plus');
        }
    }
    toggle_menu() {
        const gear = this.element.querySelector("button.nbtools-gear");
        const menu = this.element.querySelector(".nbtools-menu");
        const collapsed = menu.style.display === "none";
        // Hide or show the menu
        if (collapsed)
            menu.style.display = "block";
        else
            menu.style.display = "none";
        // Hide the menu with the next click
        const hide_next_click = function (event) {
            if (gear.contains(event.target))
                return;
            menu.style.display = "none";
            document.removeEventListener('click', hide_next_click);
        };
        document.addEventListener('click', hide_next_click);
    }
    create_menu_callback(item, template_vars = {}) {
        // Create callback for string literal
        if (typeof item === 'string')
            return new Function(process_template(item, template_vars));
        // Create callback for cell event type
        else if (item['action'] === 'cell')
            return () => Toolbox.add_code_cell(process_template(item['code'], template_vars));
        // Create callback for method event type
        else if (item['action'] === 'method')
            return () => {
                this.send({ event: 'method', method: process_template(item['code'], template_vars) });
            };
        // Create callback for custom event type
        else
            return new Function(process_template(item['code'], template_vars));
    }
    attach_menu_options() {
        const menu_items = this.model.get('extra_menu_items');
        Object.keys(menu_items).forEach((name) => {
            const item = menu_items[name];
            const callback = this.create_menu_callback(item);
            this.add_menu_item(name, callback);
        });
    }
    float_menus() {
        const fix_cell = () => {
            const elements = [
                this.el.closest('.lm-Widget.jp-OutputPrompt.jp-OutputArea-prompt'),
                this.el.closest('.lm-Widget.lm-Panel.jp-OutputArea'),
                this.el.closest('.lm-Widget.lm-Panel.jp-OutputArea-child'),
                this.el.closest('.lm-Widget.lm-Panel.jp-OutputArea-output'),
                this.el.closest('.lm-Widget.jp-OutputArea.jp-Cell-outputArea')
            ];
            elements.forEach((e) => {
                if (e)
                    e.style.overflow = 'visible';
            });
        };
        this.el.addEventListener('click', fix_cell, { once: true });
    }
    /**
     * Recursively trigger the 'displayed' event for all child widgets
     *
     * @param {DOMWidgetModel} model
     * @param {DOMWidgetView | any} view
     * @private
     */
    static _initialize_display(model, view) {
        // Trigger the display for this widget
        view.trigger('displayed');
        // Recursively trigger the display for all child widgets
        if ('children_views' in view) {
            view.children_views.update(model.get('children')).then((children) => {
                children.forEach((child) => {
                    BaseWidgetView._initialize_display(child.model, child);
                    child.el.widget = child;
                });
            });
        }
    }
    /**
     * Add the specified child widget to the view and initialize
     *
     * @param {string} element_selector
     * @param {string} model_name
     */
    attach_child_widget(element_selector, model_name) {
        const element = this.element.querySelector(element_selector);
        const model = this.model.get(model_name);
        this.create_child_view(model).then((view) => {
            element.appendChild(view.el);
            BaseWidgetView._initialize_display(model, view);
            return view;
        }).catch(reject(`Could not add ${model_name} to ${element_selector}`, true));
    }
    basics() { return this.traitlets; } // Return the list of basic traitlets
    post_render() { } // Empty function, can be overridden in subclasses
}
