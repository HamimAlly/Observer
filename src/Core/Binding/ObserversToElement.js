import { BindingBase } from './Base.js';

class BindingObserversToElement extends BindingBase
{
    constructor(args = {})
    {
        super(args);

        this._eventHandles = [];
        this._updateTimeout = null;
        
        this._deferUpdateElement = () => {
            if (this.applyingChange) return;
            
            this.applyingChange = true;
            this._updateTimeout = window.setTimeout(() => {
                this._updateElement();
            });
        };

        this._customUpdate = args.customUpdate;
    }

    _linkObserver(observer, path)
    {
        this._eventHandles.push(observer.on(`${path}:set`, this._deferUpdateElement));
        this._eventHandles.push(observer.on(`${path}:unset`, this._deferUpdateElement));
        this._eventHandles.push(observer.on(`${path}:insert`, this._deferUpdateElement));
        this._eventHandles.push(observer.on(`${path}:remove`, this._deferUpdateElement));
    }
    _updateElement()
    {
        if (this._updateTimeout)
        {
            window.clearTimeout(this._updateTimeout);
            this._updateTimeout = null;
        }

        this._updateTimeout = null;
        this.applyingChange = true;

        if (!this._element) return;
        if (typeof this._customUpdate === 'function') {this._customUpdate(this._element, this._observers, this._paths);}
        
        else if (this._observers.length === 1)
        {
            if (this._paths.length > 1)
            {
                this._element.value = this._paths.map((path) => {
                    return this._observers[0].has(path) ? this._observers[0].get(path) : undefined;
                });
            }

            else {this._element.value = (this._observers[0].has(this._paths[0]) ? this._observers[0].get(this._paths[0]) : undefined);}
        }

        else
        {
            this._element.values = this._observers.map((observer, i) => {
                const path = this._pathAt(this._paths, i);
                return observer.has(path) ? observer.get(path) : undefined;
            });
        }

        this.applyingChange = false;
    }

    link(observers, paths)
    {
        super.link(observers, paths);

        if (this._element)
        {
            const renderChanges = this._element.renderChanges;
            this._element.renderChanges = false;
            this._updateElement();
            this._element.renderChanges = renderChanges;
        }

        if (this._observers.length === 1)
        {
            if (this._paths.length > 1)
            {
                for (let i = 0; i < this._paths.length; i++) {this._linkObserver(this._observers[0], this._paths[i]);}
                return;
            }
        }

        for (let i = 0; i < this._observers.length; i++) {this._linkObserver(this._observers[i], this._pathAt(this._paths, i));}
    }

    unlink()
    {
        for (const event of this._eventHandles) {event.unbind();}
        this._eventHandles.length = 0;

        if (this._updateTimeout)
        {
            window.clearTimeout(this._updateTimeout);
            this._updateTimeout = null;
        }

        super.unlink();
    }

    clone() {return new BindingObserversToElement({customUpdate: this._customUpdate});}
}

export { BindingObserversToElement };