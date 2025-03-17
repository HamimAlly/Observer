import { CLASS_NOT_FLEXIBLE, CLASS_MULTIPLE_VALUES } from '../../class.js';
import { Element } from '../Element/index.js';

const CLASS_BOOLEAN_INPUT = 'boolean-input';
const CLASS_BOOLEAN_INPUT_TICKED = `${CLASS_BOOLEAN_INPUT}-ticked`;
const CLASS_BOOLEAN_INPUT_TOGGLE = `${CLASS_BOOLEAN_INPUT}-toggle`;

class BooleanInput extends Element
{
    constructor(args = {})
    {
        super(Object.assign({ tabIndex: 0 }, args));

        this._onKeyDown = (evt) => {
            
            if (evt.key === 'Escape')
            {
                this.blur();
                return;
            }

            if (!this.enabled || this.readOnly) return;
            
            if (evt.key === ' ')
            {
                evt.stopPropagation();
                evt.preventDefault();
                this.value = !this.value;
            }
        };

        this._onFocus = () => {this.emit('focus');};
        this._onBlur = () => {this.emit('blur');};
        
        if (args.type === 'toggle') this.class.add(CLASS_BOOLEAN_INPUT_TOGGLE);
        else this.class.add(CLASS_BOOLEAN_INPUT);

        this.class.add(CLASS_NOT_FLEXIBLE);
        
        this.dom.addEventListener('keydown', this._onKeyDown);
        this.dom.addEventListener('focus', this._onFocus);
        this.dom.addEventListener('blur', this._onBlur);

        this._value = null;
        if (args.value !== undefined) this.value = args.value;
        this.renderChanges = args.renderChanges !== null && args.renderChanges !== void 0 ? args.renderChanges : false;
    }

    destroy()
    {
        if (this._destroyed) return;
        this.dom.removeEventListener('keydown', this._onKeyDown);
        this.dom.removeEventListener('focus', this._onFocus);
        this.dom.removeEventListener('blur', this._onBlur);
        super.destroy();
    }

    _onClick(evt)
    {
        if (this.enabled) this.focus();
        if (this.enabled && !this.readOnly) this.value = !this.value;
        return super._onClick(evt);
    }

    _updateValue(value)
    {
        this.class.remove(CLASS_MULTIPLE_VALUES);
        if (value === this.value) return false;
        this._value = value;

        if (value) this.class.add(CLASS_BOOLEAN_INPUT_TICKED);
        else this.class.remove(CLASS_BOOLEAN_INPUT_TICKED);

        if (this.renderChanges) this.flash();
        this.emit('change', value);
        return true;
    }

    focus() {this.dom.focus();}
    blur() {this.dom.blur();}

    set value(value)
    {
        const changed = this._updateValue(value);
        if (changed && this._binding) this._binding.setValue(value);
    }

    get value() {return this._value;}

    set values(values)
    {
        const different = values.some(v => v !== values[0]);
        if (different)
        {
            this._updateValue(null);
            this.class.add(CLASS_MULTIPLE_VALUES);
        }

        else this._updateValue(values[0]);
    }

    set renderChanges(value) {this._renderChanges = value;}
    get renderChanges() {return this._renderChanges;}
}

Element.register('boolean', BooleanInput, { renderChanges: true });

export { BooleanInput };