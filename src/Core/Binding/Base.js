import { Events } from '../Event/Events.js';

class BindingBase extends Events
{
    constructor(args)
    {
        super();
        this._observers = [];
        this._paths = [];
        this._applyingChange = false;
        this._linked = false;
        this._element = args.element;
        this._history = args.history;
        this._historyPrefix = args.historyPrefix;
        this._historyPostfix = args.historyPostfix;
        this._historyName = args.historyName;
        this._historyCombine = args.historyCombine ?? false;
    }

    _pathAt(paths, index) {return paths[index] || paths[0];}

    link(observers, paths)
    {
        if (this._observers) this.unlink();

        this._observers = Array.isArray(observers) ? observers : [observers];
        this._paths = Array.isArray(paths) ? paths : [paths];
        this._linked = true;
    }

    unlink()
    {
        this._observers = [];
        this._paths = [];
        this._linked = false;
    }

    clone() {throw new Error('BindingBase#clone: Not implemented');}
    
    setValue(value) {}
    setValues(values) {}
    addValue(value) {}
    addValues(values) {}
    removeValue(value) {}
    removeValues(values) {}

    set element(value) {this._element = value;}
    get element() {return this._element;}

    set applyingChange(value)
    {
        if (this._applyingChange === value) return;
        this._applyingChange = value;
        this.emit('applyingChange', value);
    }

    get applyingChange() {return this._applyingChange;}
    get linked() {return this._linked;}

    set historyCombine(value) {this._historyCombine = value;}
    get historyCombine() {return this._historyCombine;}

    set historyName(value) {this._historyName = value;}
    get historyName() {return this._historyName;}

    set historyPrefix(value) {this._historyPrefix = value;}
    get historyPrefix() {return this._historyPrefix;}

    set historyPostfix(value) {this._historyPostfix = value;}
    get historyPostfix() {return this._historyPostfix;}

    set historyEnabled(value) {if (this._history) this._history.enabled = value;}
    get historyEnabled() {return this._history && this._history.enabled;}

    get observers() {return this._observers;}
    get paths() {return this._paths;}
}

export { BindingBase };