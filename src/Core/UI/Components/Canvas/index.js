import { Element } from '../Element/index.js';

class Canvas extends Element
{
    constructor(args = {})
    {
        super(Object.assign({ dom: 'canvas', class: 'canvas' }, args));
        this._width = 300;
        this._height = 150;
        this._ratio = 1;

        const { useDevicePixelRatio = false } = args;
        this._ratio = useDevicePixelRatio ? window.devicePixelRatio : 1;
        this.dom.onselectstart = (evt) => {return false;};
    }

    resize(width, height)
    {
        if (this._width === width && this._height === height) return;

        this._width = width;
        this._height = height;
        const canvas = this._dom;
        canvas.width = this.pixelWidth;
        canvas.height = this.pixelHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        this.emit('resize', width, height);
    }

    set width(value)
    {
        if (this._width === value) return;
        this._width = value;
        const canvas = this._dom;
        canvas.width = this.pixelWidth;
        canvas.style.width = `${value}px`;
        this.emit('resize', this._width, this._height);
    }

    get width() {return this._width;}

    set height(value)
    {
        if (this._height === value) return;
        this._height = value;
        const canvas = this._dom;
        canvas.height = this.pixelHeight;
        canvas.style.height = `${value}px`;
        this.emit('resize', this._width, this._height);
    }

    get height() {return this._height;}
    get pixelWidth() {return Math.floor(this._width * this._ratio);}
    get pixelHeight() {return Math.floor(this._height * this._ratio);}
    get pixelRatio() {return this._ratio;}
}

Element.register('canvas', Canvas);

export { Canvas };