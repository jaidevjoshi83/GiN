import '../style/galaxyoutput.css';
import { unpack_models } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { UIOutputView, UIOutputModel } from "@genepattern/nbtools";
//import { extract_file_name, extract_file_type, is_absolute_path, is_url } from '@genepattern/nbtools';
//import { ContextManager } from "@genepattern/nbtools";

export class TestUIOutputModel extends UIOutputModel {
    defaults() {
        //return Object.assign(Object.assign({}, super.defaults()), { _model_name: TestUIOutputModel.model_name, _model_module: TestUIOutputModel.model_module, _model_module_version: TestUIOutputModel.model_module_version, _view_name: TestUIOutputModel.view_name, _view_module: TestUIOutputModel.view_module, _view_module_version: TestUIOutputModel.view_module_version, name: 'Python Results', description: '', status: '', files: [], text: '', visualization: '', appendix: undefined, extra_file_menu_items: {} }), inputs:{});
        return Object.assign(Object.assign({}, super.defaults()), { _model_name: TestUIOutputModel.model_name, _model_module: TestUIOutputModel.model_module, _model_module_version: TestUIOutputModel.model_module_version, _view_name: TestUIOutputModel.view_name, _view_module: TestUIOutputModel.view_module, _view_module_version: TestUIOutputModel.view_module_version, name: 'Python Results', description: '', status: '', files: [], text: '', visualization: '', appendix: undefined, extra_file_menu_items: {}, inputs:{} });
    }
}
TestUIOutputModel.model_name = 'TestUIOutputModel';
TestUIOutputModel.model_module = MODULE_NAME;
TestUIOutputModel.model_module_version = MODULE_VERSION;
TestUIOutputModel.view_name = 'TestUIOutputView';
TestUIOutputModel.view_module = MODULE_NAME;
TestUIOutputModel.view_module_version = MODULE_VERSION;
TestUIOutputModel.serializers = Object.assign(Object.assign({}, UIOutputModel.serializers), { appendix: {
        deserialize: (value, manager) => unpack_models(value, manager)
    } });

export class TestUIOutputView extends UIOutputView {
    constructor() {
        super(...arguments);
        this.dom_class = 'nbtools-Testuioutput';

    }

    // render() {
    //     this.el.classList.add('custom-widget');
    //     this.value_changed();
    //     this.model.on('change:value', this.value_changed, this);
    // }
    // value_changed() {

    //     const All = this.model.get('inputs');
    //     this.el.textContent = All.label;
    //     console.log(All.label);
    // }
}
