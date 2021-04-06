/**
 * Widget for representing Python output as an interactive interface
 *
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */
 import '../css/output.css'
 import { ISerializers, ManagerBase, unpack_models } from '@jupyter-widgets/base';
 import { MODULE_NAME, MODULE_VERSION } from './version';
 import { UIOutputView, UIOutputModel } from "@genepattern/nbtools";
 //import { extract_file_name, extract_file_type, is_absolute_path, is_url } from '@genepattern/nbtools';
 //import { ContextManager } from "@genepattern/nbtools";
 
 
 export class GalaxyUIOutputModel extends UIOutputModel {
     static model_name = 'GalaxyUIOutputModel';
     static model_module = MODULE_NAME;
     static model_module_version = MODULE_VERSION;
     static view_name = 'GalaxyUIOutputView';
     static view_module = MODULE_NAME;
     static view_module_version = MODULE_VERSION;
 
     static serializers: ISerializers = {
         ...UIOutputModel.serializers,
         appendix: {
             deserialize: (value: any, manager: ManagerBase<any>|undefined) =>
                 unpack_models(value, manager as ManagerBase<any>)
         }
     };
 
     defaults() {
         return {
             ...super.defaults(),
             _model_name: GalaxyUIOutputModel.model_name,
             _model_module: GalaxyUIOutputModel.model_module,
             _model_module_version: GalaxyUIOutputModel.model_module_version,
             _view_name: GalaxyUIOutputModel.view_name,
             _view_module: GalaxyUIOutputModel.view_module,
             _view_module_version: GalaxyUIOutputModel.view_module_version,
             name: 'Python Results',
             description: '',
             status: '',
             files: [],
             text: '',
             visualization: '',
             appendix: undefined,
             extra_file_menu_items: {}
         };
     }
 }
 
 export class GalaxyUIOutputView extends UIOutputView {




     dom_class = 'nbtools-galaxyuioutput';

 }