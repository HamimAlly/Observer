import { Element } from '../Element/index.js';

class Button extends Element
{
    constructor(args = {})
    {
        super(Object.assign({ dom: 'button', class: 'button'}, args));

        this._onKeyDown = (evt) => {
            if (evt.key === 'Escape') this.blur();
            else if (evt.key === 'Enter') this._onClick(evt);
        };

        this._unsafe = args.unsafe;
        this.text = args.text;
        this.size = args.size;
        this.icon = args.icon;
    
        this.dom.addEventListener('keydown', this._onKeyDown);
    }

    destroy()
    {
        if (this._destroyed) return;
        this.dom.removeEventListener('keydown', this._onKeyDown);
        super.destroy();
    }

    _onClick(evt)
    {
        this.blur();
        if (this.readOnly) return;
        super._onClick(evt);
    }

    focus() {this.dom.focus();}
    blur() {this.dom.blur();}

    set text(value)
    {
        if (this._text === value) return;

        this._text = value;

        if (this._unsafe) this.dom.innerHTML = value;
        else this.dom.textContent = value;
    }

    get text() {return this._text;}

    set icon(value)
    {
        if (this._icon === value || !value.match(/^E\d{0,4}$/)) return;

        this._icon = value;
        if (value) this.dom.setAttribute('data-icon', String.fromCodePoint(parseInt(value, 16)));
        else this.dom.removeAttribute('data-icon');
    }

    get icon() {return this._icon;}

    set size(value)
    {
        if (this._size === value) return;

        if (this._size)
        {
            this.class.remove(this._size);
            this._size = null;
        }

        this._size = value;

        if (this._size) this.class.add(this._size);
    }

    get size() {return this._size;}
}

Element.register('button', Button);

export { Button };