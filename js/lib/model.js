import { Signal } from '@lumino/signaling';
export class KernelModel {
    constructor(session) {
        this._onIOPub = (msg) => {
            const msgType = msg.header.msg_type;
            switch (msgType) {
                case 'execute_result':
                case 'display_data':
                case 'update_display_data':
                    this._output = msg.content;
                    console.log(this._output);
                    this._stateChanged.emit();
                    break;
                default:
                    break;
            }
            return;
        };
        this._future = null;
        this._output = null;
        this._stateChanged = new Signal(this);
        this._sessionContext = session;
    }
    get future() {
        return this._future;
    }
    set future(value) {
        this._future = value;
        if (!value) {
            return;
        }
        value.onIOPub = this._onIOPub;
    }
    get output() {
        return this._output;
    }
    get stateChanged() {
        return this._stateChanged;
    }
    execute(code) {
        var _a, _b, _c;
        if (!this._sessionContext || !((_a = this._sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel)) {
            return;
        }
        this.future = (_c = (_b = this._sessionContext.session) === null || _b === void 0 ? void 0 : _b.kernel) === null || _c === void 0 ? void 0 : _c.requestExecute({
            code,
        });
    }
}
