/**
 * Widget for representing Python output as an interactive interface
 *
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */
import '../css/output.css';
import { ISerializers } from '@jupyter-widgets/base';
import { UIOutputView, UIOutputModel } from "@genepattern/nbtools";
export declare class GalaxyUIOutputModel extends UIOutputModel {
    static model_name: string;
    static model_module: any;
    static model_module_version: any;
    static view_name: string;
    static view_module: any;
    static view_module_version: any;
    static serializers: ISerializers;
    defaults(): any;
}
export declare class GalaxyUIOutputView extends UIOutputView {
    dom_class: string;
}
