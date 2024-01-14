import { MODULE_NAME, MODULE_VERSION } from "./version";
import { BaseWidgetModel, BaseWidgetView } from "@g2nb/nbtools";
import { ContextManager } from "@g2nb/nbtools";
import '../style/basewidget.css';

// noinspection JSAnnotator
export class GalaxyBaseWidgetModel extends BaseWidgetModel {
    defaults() {
        return Object.assign(Object.assign({}, super.defaults()), { _id: '', origin: '', name: '', subtitle: '', description: '', collapsed: false, color: 'var(--jp-layout-color4)', logo: ContextManager.context().default_logo(), info: '', error: '', extra_menu_items: {} });
    }
}
GalaxyBaseWidgetModel.model_name = 'GalaxyBaseWidgetModel';
GalaxyBaseWidgetModel.model_module = MODULE_NAME;
GalaxyBaseWidgetModel.model_module_version = MODULE_VERSION;
GalaxyBaseWidgetModel.view_name = 'GalaxyBaseWidgetModel';
GalaxyBaseWidgetModel.view_module = MODULE_NAME;
GalaxyBaseWidgetModel.view_module_version = MODULE_VERSION;
GalaxyBaseWidgetModel.serializers = Object.assign({}, BaseWidgetModel.serializers);
// noinspection JSAnnotator
export class GalaxyBaseWidgetView extends BaseWidgetView {
    constructor() {
        super(...arguments);
        
    }
    render() {
        super.render();
        // this.element.className = 'galaxy galaxy-uibuilder lm-Widget p-Widget'
    }
}