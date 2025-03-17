import { Events } from '../../../Event/Events.js';
import { CLASS_FONT_REGULAR, CLASS_FLASH, CLASS_DISABLED, CLASS_READONLY, CLASS_HIDDEN, CLASS_ERROR } from '../../class.js';

const SIMPLE_CSS_PROPERTIES = [
    'flexDirection',
    'flexGrow',
    'flexBasis',
    'flexShrink',
    'flexWrap',
    'alignItems',
    'alignSelf',
    'justifyContent',
    'justifySelf'
];

class Element extends Events
{
    static EVENT_ENABLE = 'enable';
    static EVENT_DISABLE = 'disable';
    static EVENT_HIDE = 'hide';
    static EVENT_HIDE_TO_ROOT = 'hideToRoot';
    static EVENT_SHOW = 'show';
    static EVENT_SHOW_TO_ROOT = 'showToRoot';
    static EVENT_READ_ONLY = 'readOnly';
    static EVENT_PARENT = 'parent';
    static EVENT_CLICK = 'click';
    static EVENT_HOVER = 'hover';
    static EVENT_HOVER_END = 'hoverend';
    static EVENT_DESTROY = 'destroy';
    static registry = new Map();

    constructor(args = {})
    {
        super();

        this._destroyed = false;
        this._parent = null;
        this._eventsParent = [];
        this._flashTimeout = null;
        this._suppressChange = false;

        this._onMouseOver = (evt) => {this.emit('hover', evt)};
        this._onMouseOut = (evt) => {this.emit('hoverend', evt)};
        
        if (typeof args.dom === 'string') {this._dom = document.createElement(args.dom);}
        else if (args.dom instanceof Node) {this._dom = args.dom;}
        else {this._dom = document.createElement('div');}
        if (args.id !== undefined) {this._dom.id = args.id;}

        this._dom.ui = this;
        this._onClickEvt = this._onClick.bind(this);

        this._dom.addEventListener('click', this._onClickEvt);
        this._dom.addEventListener('mouseover', this._onMouseOver);
        this._dom.addEventListener('mouseout', this._onMouseOut);

        this._dom.classList.add('element', CLASS_FONT_REGULAR);

        if (args.class)
        {
            const classes = Array.isArray(args.class) ? args.class : [args.class];
            for (const cls of classes) {this._dom.classList.add(cls);}
        }

        this._hiddenParents = !args.isRoot;

        this.enabled = args.enabled ?? true;
        this.hidden = args.hidden ?? false;
        this.readOnly = args.readOnly ?? false;
        this.ignoreParent = args.ignoreParent ?? false;

        if (args.width !== undefined) this.width = args.width;
        if (args.height !== undefined) this.height = args.height;
        if (args.tabIndex !== undefined) this.tabIndex = args.tabIndex;

        for (const key in args)
        {
            if (args[key] === undefined) continue;
            if (SIMPLE_CSS_PROPERTIES.indexOf(key) !== -1) this[key] = args[key];
        }

        if (args.binding) this.binding = args.binding;
    }

    destroy()
    {
        if (this._destroyed) return;

        this._destroyed = true;

        if (this.binding) this.binding = null;
        else this.unlink();

        if (this.parent)
        {
            const parent = this.parent;

            for (const event of this._eventsParent) {event.unbind();}

            this._eventsParent.length = 0;

            if (parent.remove && !parent._destroyed) parent.remove(this);

            this._parent = null;

            if (!parent._destroyed && this._dom && this._dom.parentElement) this._dom.parentElement.removeChild(this._dom);
        }

        const dom = this._dom;

        if (dom)
        {
            dom.removeEventListener('click', this._onClickEvt);
            dom.removeEventListener('mouseover', this._onMouseOver);
            dom.removeEventListener('mouseout', this._onMouseOut);

            delete dom.ui;
            this._dom = null;
        }

        if (this._flashTimeout) window.clearTimeout(this._flashTimeout);

        this.emit('destroy', dom, this);
        this.unbind();
    }

    link(observers, paths) {if (this._binding) this._binding.link(observers, paths);}
    unlink() {if (this._binding) this._binding.unlink();}

    flash()
    {
        if (this._flashTimeout) return;

        this.class.add(CLASS_FLASH);
        this._flashTimeout = window.setTimeout(() => {
            this._flashTimeout = null;
            this.class.remove(CLASS_FLASH);
        }, 200);
    }

    _onClick(evt) {if (this.enabled) this.emit('click', evt);}
    _onHiddenToRootChange(hiddenToRoot) {this.emit(hiddenToRoot ? 'hideToRoot' : 'showToRoot');}
    
    _onEnabledChange(enabled)
    {
        if (enabled) this.class.remove(CLASS_DISABLED);
        else {this.class.add(CLASS_DISABLED);}
        this.emit(enabled ? 'enable' : 'disable');
    }

    _onParentDestroy() {this.destroy();}
    
    _onParentDisable()
    {
        if (this._ignoreParent) return;
        if (this._enabled) this._onEnabledChange(false);
    }

    _onParentEnable()
    {
        if (this._ignoreParent) return;
        if (this._enabled) this._onEnabledChange(true);
    }

    _onParentShowToRoot()
    {
        const oldHiddenToRoot = this.hiddenToRoot;
        this._hiddenParents = false;
        if (oldHiddenToRoot !== this.hiddenToRoot) this._onHiddenToRootChange(this.hiddenToRoot);
    }

    _onParentHideToRoot()
    {
        const oldHiddenToRoot = this.hiddenToRoot;
        this._hiddenParents = true;
        if (oldHiddenToRoot !== this.hiddenToRoot) this._onHiddenToRootChange(this.hiddenToRoot);
    }

    _onReadOnlyChange(readOnly)
    {
        if (readOnly) this.class.add(CLASS_READONLY);
        else this.class.remove(CLASS_READONLY);
        this.emit('readOnly', readOnly);
    }

    _onParentReadOnlyChange(readOnly)
    {
        if (this._ignoreParent) return;
        if (this._readOnly !== readOnly) this._onReadOnlyChange(readOnly);
    }

    static register(type, cls, defaultArguments) {Element.registry.set(type, { cls, defaultArguments });}
    static unregister(type) {Element.registry.delete(type);}

    static create(type, args)
    {
        const entry = Element.registry.get(type);

        if (!entry)
        {
            console.error('Invalid type passed to Element.create:', type);
            return undefined;
        }
        const cls = entry.cls;
        const clsArgs = Object.assign(Object.assign({}, entry.defaultArguments), args);

        return new cls(clsArgs);
    }

    set enabled(value)
    {
        if (this._enabled === value) return;

        const enabled = this.enabled;
        this._enabled = value;

        if (enabled !== value) this._onEnabledChange(value);
    }

    get enabled()
    {
        if (this._ignoreParent) return this._enabled;
        return this._enabled && (!this._parent || this._parent.enabled);
    }

    set ignoreParent(value)
    {
        this._ignoreParent = value;
        this._onEnabledChange(this.enabled);
        this._onReadOnlyChange(this.readOnly);
    }

    get ignoreParent() {return this._ignoreParent;}
    get dom() {return this._dom;}

    set parent(value)
    {
        if (value === this._parent) return;

        const oldEnabled = this.enabled;
        const oldReadonly = this.readOnly;
        const oldHiddenToRoot = this.hiddenToRoot;

        if (this._parent)
        {
            for (let i = 0; i < this._eventsParent.length; i++) {this._eventsParent[i].unbind();}
            this._eventsParent.length = 0;
        }

        this._parent = value;

        if (this._parent)
        {
            this._eventsParent.push(this._parent.once('destroy', this._onParentDestroy.bind(this)));
            this._eventsParent.push(this._parent.on('disable', this._onParentDisable.bind(this)));
            this._eventsParent.push(this._parent.on('enable', this._onParentEnable.bind(this)));
            this._eventsParent.push(this._parent.on('readOnly', this._onParentReadOnlyChange.bind(this)));
            this._eventsParent.push(this._parent.on('showToRoot', this._onParentShowToRoot.bind(this)));
            this._eventsParent.push(this._parent.on('hideToRoot', this._onParentHideToRoot.bind(this)));
            this._hiddenParents = this._parent.hiddenToRoot;
        }

        else this._hiddenParents = true;

        this.emit('parent', this._parent);

        const newEnabled = this.enabled;
        if (newEnabled !== oldEnabled) this._onEnabledChange(newEnabled);

        const newReadonly = this.readOnly;
        if (newReadonly !== oldReadonly) this._onReadOnlyChange(newReadonly);
        
        const hiddenToRoot = this.hiddenToRoot;
        if (hiddenToRoot !== oldHiddenToRoot) this._onHiddenToRootChange(hiddenToRoot);
    }

    get parent() {return this._parent;}

    set hidden(value)
    {
        if (value === this._hidden) return;
        
        const oldHiddenToRoot = this.hiddenToRoot;
        this._hidden = value;

        if (value) this.class.add(CLASS_HIDDEN);
        else this.class.remove(CLASS_HIDDEN);

        this.emit(value ? 'hide' : 'show');

        if (this.hiddenToRoot !== oldHiddenToRoot) this._onHiddenToRootChange(this.hiddenToRoot);
    }

    get hidden() {return this._hidden;}
    get hiddenToRoot() {return this._hidden || this._hiddenParents;}

    set readOnly(value)
    {
        if (this._readOnly === value) return;
        this._readOnly = value;
        this._onReadOnlyChange(value);
    }

    get readOnly()
    {
        if (this._ignoreParent) return this._readOnly;
        return this._readOnly || !!(this._parent && this._parent.readOnly);
    }
   
    set error(value)
    {
        if (this._hasError === value) return;

        this._hasError = value;

        if (value) this.class.add(CLASS_ERROR);
        else this.class.remove(CLASS_ERROR);
    }

    get error() {return this._hasError;}
    get style() {return this._dom.style;}
    get class() {return this._dom.classList;}
    
    set width(value) {this.style.width = typeof value === 'number' ? `${value}px` : value;}
    get width() {return this._dom.clientWidth;}

    set height(value) {this.style.height = typeof value === 'number' ? `${value}px` : value;}
    get height() {return this._dom.clientHeight;}

    set tabIndex(value) {this._dom.tabIndex = value;}
    get tabIndex() {return this._dom.tabIndex;}

    set binding(value)
    {
        if (this._binding === value) return;

        let prevObservers;
        let prevPaths;

        if (this._binding)
        {
            prevObservers = this._binding.observers;
            prevPaths = this._binding.paths;
            this.unlink();
            this._binding.element = null;
            this._binding = null;
        }

        this._binding = value;

        if (this._binding)
        {
            this._binding.element = this;
            if (prevObservers && prevPaths) this.link(prevObservers, prevPaths);
        }
    }

    get binding() {return this._binding;}
    get destroyed() {return this._destroyed;}

    set flexDirection(value) {this.style.flexDirection = value;}
    get flexDirection() {return this.style.flexDirection;}

    set flexGrow(value) {this.style.flexGrow = value;}
    get flexGrow() {return this.style.flexGrow;}

    set flexBasis(value) {this.style.flexBasis = value;}
    get flexBasis() {return this.style.flexBasis;}

    set flexShrink(value) {this.style.flexShrink = value;}
    get flexShrink() {return this.style.flexShrink;}

    set flexWrap(value) {this.style.flexWrap = value;}
    get flexWrap() {return this.style.flexWrap;}

    set alignItems(value) {this.style.alignItems = value;}
    get alignItems() {return this.style.alignItems;}

    set alignSelf(value) {this.style.alignSelf = value;}
    get alignSelf() {return this.style.alignSelf;}

    set justifyContent(value) {this.style.justifyContent = value;}
    get justifyContent() {return this.style.justifyContent;}

    set justifySelf(value) {this.style.justifySelf = value;}
    get justifySelf() {return this.style.justifySelf;}

    set disabled(value) {this.enabled = !value;}
    get disabled() {return !this.enabled;}

    set element(value) {this._dom = value;}
    get element() {return this.dom;}

    set innerElement(value) {this._domContent = value;}
    get innerElement() {return this._domContent;}
}

export { Element };