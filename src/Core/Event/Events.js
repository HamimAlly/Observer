import { EventHandle } from './Event-Handle.js';

class EmitterCollection
{
    constructor() {this._emitters = new Set();}

    add(emitter) {this._emitters.add(emitter);}
    remove(emitter) {this._emitters.delete(emitter);}
    emit(name, ...args) {this._emitters.forEach(emitter => emitter.emit(name, ...args));}
}

class Events
{
    constructor()
    {
        this._suspendEvents = false;
        this._events = new Map();
        this._emitters = new EmitterCollection();
    }

    get suspendEvents() { return this._suspendEvents; }
    set suspendEvents(value) { this._suspendEvents = !!value; }

    on(name, fn)
    {
        if (!this._events.has(name)) this._events.set(name, new Set());
        this._events.get(name).add(fn);
        return new EventHandle(this, name, fn);
    }

    once(name, fn)
    {
        const evt = this.on(name, (...args) => {
            fn.apply(this, args);
            evt.unbind();
        });

        return evt;
    }

    emit(name, ...args)
    {
        if (this._suspendEvents) return this;

        if (this._events.has(name))
        {
            for (const fn of this._events.get(name))
            {
                try {fn.apply(this, args);}
                catch (ex)
                {
                    console.info('%c%s %c(event error)', 'color: #06f', name, 'color: #f00');
                    console.log(ex.stack);
                }
            }
        }

        this._emitters.emit(name, ...args);
        return this;
    }

    unbind(name, fn)
    {
        if (name)
        {
            const events = this._events.get(name);
            if (!events) return this;

            if (fn)
            {
                events.delete(fn);
                if (events.size === 0) this._events.delete(name);
            } 
            
            else this._events.delete(name);
        } 
        
        else this._events.clear();
        return this;
    }

    addEmitter(emitter) {this._emitters.add(emitter);}
    removeEmitter(emitter) {this._emitters.remove(emitter);}
}

export { Events };