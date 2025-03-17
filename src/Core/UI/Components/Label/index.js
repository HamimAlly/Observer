import { CLASS_DEFAULT_MOUSEDOWN, CLASS_MULTIPLE_VALUES } from '../../class.js';
import { Element } from '../Element/index.js';

class Label extends Element
{
    constructor(args = {})
    {
        super(Object.assign({ dom: 'span' }, args));
        this.class.add('label');

        this._unsafe = args.unsafe ?? false;
        this.text = args.text ?? args.value ?? '';
        
        if (args.allowTextSelection) this.class.add(CLASS_DEFAULT_MOUSEDOWN);
        if (args.nativeTooltip) this.dom.title = this.text;

        this.placeholder = args.placeholder;
        this.renderChanges = args.renderChanges;

        this.on('change', () => {if (this.renderChanges) this.flash();});
    }

    _updateText(value)
    {
        this.class.remove(CLASS_MULTIPLE_VALUES);

        if (this._text === value) return false;

        this._text = value;
        
        if (this._unsafe) this._dom.innerHTML = value;
        else this._dom.textContent = value;

        this.emit('change', value);
        return true;
    }

    set text(value)
    {
        if (value === undefined || value === null) value = '';
        const changed = this._updateText(value);
        if (changed && this._binding) this._binding.setValue(value);
    }

    get text() {return this._text;}

    set value(value) {this.text = value;}
    get value() {return this.text;}

    set values(values)
    {
        const different = values.some(v => v !== values[0]);
        if (different)
        {
            this._updateText('');
            this.class.add(CLASS_MULTIPLE_VALUES);
        }

        else this._updateText(values[0]);
    }

    set placeholder(value)
    {
        if (value) this.dom.setAttribute('placeholder', value);
        else this.dom.removeAttribute('placeholder');
    }

    get placeholder() {return this.dom.getAttribute('placeholder');}

    set renderChanges(value) {this._renderChanges = value;}
    get renderChanges() {return this._renderChanges;}
}

Element.register('label', Label);

export { Label };