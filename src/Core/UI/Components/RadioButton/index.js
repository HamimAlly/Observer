import { CLASS_NOT_FLEXIBLE, CLASS_MULTIPLE_VALUES } from '../../class.js';
import { Element } from '../Element/index.js';

const CLASS_RADIO_BUTTON = 'radio-button';
const CLASS_RADIO_BUTTON_SELECTED = `${CLASS_RADIO_BUTTON}-selected`;

class RadioButton extends Element
{
    constructor(args = {})
    {
        super(Object.assign({ tabIndex: 0, class: CLASS_RADIO_BUTTON}, args));

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

        this._onFocus = (evt) => {this.emit('focus');};
        this._onBlur = (evt) => {this.emit('blur');};

        this.class.add(CLASS_NOT_FLEXIBLE);

        this.dom.addEventListener('keydown', this._onKeyDown);
        this.dom.addEventListener('focus', this._onFocus);
        this.dom.addEventListener('blur', this._onBlur);

        this.value = args.value;
        this._renderChanges = args.renderChanges;
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

        if (value) this.class.add(CLASS_RADIO_BUTTON_SELECTED);
        else this.class.remove(CLASS_RADIO_BUTTON_SELECTED);

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

    set renderChanges(renderChanges) {this._renderChanges = renderChanges;}
    get renderChanges() {return this._renderChanges;}
}

Element.register('radio', RadioButton, { renderChanges: true });

export { RadioButton };