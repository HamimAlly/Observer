import { CLASS_FOCUS } from '../../class.js';
import { Element } from '../Element/index.js';

class InputElement extends Element
{
    constructor(args = {})
    {
        super(args);
        this.class.add('input-element');
        
        this.blurOnEnter = true;
        this.blurOnEscape = true;

        this._onInputFocus = (evt) => {
            this.class.add(CLASS_FOCUS);
            this.emit('focus', evt);
            this._prevValue = this._domInput.value;
        };

        this._onInputBlur = (evt) => {
            this.class.remove(CLASS_FOCUS);
            this.emit('blur', evt);
        };

        this._onInputKeyUp = (evt) => {
            if (evt.key !== 'Escape') this._onInputChange(evt);
            this.emit('keyup', evt);
        };

        this._onInputCtxMenu = (evt) => {this._domInput.select();};
        
        this._updateInputReadOnly = () => {
            const readOnly = !this.enabled || this.readOnly;
            if (readOnly) this._domInput.setAttribute('readonly', 'true');
            else this._domInput.removeAttribute('readonly');
        };

        let input = args.input;
        if (!input)
        {
            input = document.createElement('input');
            input.type = 'text';
        }

        input.ui = this;
        input.tabIndex = 0;
        input.autocomplete = 'off';
        this._onInputKeyDownEvt = this._onInputKeyDown.bind(this);
        this._onInputChangeEvt = this._onInputChange.bind(this);

        input.addEventListener('change', this._onInputChangeEvt);
        input.addEventListener('keydown', this._onInputKeyDownEvt);
        input.addEventListener('focus', this._onInputFocus);
        input.addEventListener('blur', this._onInputBlur);
        input.addEventListener('contextmenu', this._onInputCtxMenu, false);

        this.dom.appendChild(input);
        this._domInput = input;
        this._suspendInputChangeEvt = false;

        if (args.value !== undefined) this._domInput.value = args.value;

        this.placeholder = args.placeholder ?? '';
        this.renderChanges = args.renderChanges ?? false;
        this.blurOnEnter = args.blurOnEnter ?? true;
        this.blurOnEscape = args.blurOnEscape ?? true;
        this.keyChange = args.keyChange ?? false;
        
        this._prevValue = null;

        this.on('change', () => {if (this.renderChanges) this.flash();});
        this.on('disable', this._updateInputReadOnly);
        this.on('enable', this._updateInputReadOnly);
        this.on('readOnly', this._updateInputReadOnly);

        this._updateInputReadOnly();
    }

    destroy()
    {
        if (this._destroyed) return;
        const input = this._domInput;

        input.removeEventListener('change', this._onInputChangeEvt);
        input.removeEventListener('keydown', this._onInputKeyDownEvt);
        input.removeEventListener('focus', this._onInputFocus);
        input.removeEventListener('blur', this._onInputBlur);
        input.removeEventListener('keyup', this._onInputKeyUp);
        input.removeEventListener('contextmenu', this._onInputCtxMenu);

        super.destroy();
    }

    _onInputKeyDown(evt)
    {
        if (evt.key === 'Enter' && this.blurOnEnter)
        {
            this._suspendInputChangeEvt = this.keyChange;
            this._domInput.blur();
            this._suspendInputChangeEvt = false;
        }

        else if (evt.key === 'Escape')
        {
            this._suspendInputChangeEvt = true;
            const prev = this._domInput.value;

            this._domInput.value = this._prevValue;
            this._suspendInputChangeEvt = false;

            if (this.keyChange && prev !== this._prevValue) this._onInputChange(evt);
            if (this.blurOnEscape) this._domInput.blur();
        }

        this.emit('keydown', evt);
    }

    _onInputChange(evt) {}

    focus(select)
    {
        this._domInput.focus();
        if (select) this._domInput.select();
    }

    blur() {this._domInput.blur();}

    set placeholder(value)
    {
        if (value) this.dom.setAttribute('placeholder', value);
        else this.dom.removeAttribute('placeholder');
    }

    get placeholder() {return this.dom.getAttribute('placeholder') ?? '';}

    set keyChange(value)
    {
        if (this._keyChange === value) return;
        this._keyChange = value;
        if (value) this._domInput.addEventListener('keyup', this._onInputKeyUp);
        else this._domInput.removeEventListener('keyup', this._onInputKeyUp);
    }

    get keyChange() {return this._keyChange;}
    get input() {return this._domInput;}

    set renderChanges(value) {this._renderChanges = value;}
    get renderChanges() {return this._renderChanges;}
}

export { InputElement };