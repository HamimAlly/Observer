class EventHandle
{
    constructor(owner, name, fn)
    {
        this.owner = owner;
        this.name = name;
        this.fn = fn;
    }

    unbind()
    {
        if (this.owner)
        { 
            this.owner.unbind(this.name, this.fn);
            this.owner = null;
            this.name = null;
            this.fn = null;
        }
    }

    call(...args) {this.fn?.call(this.owner, ...args);}
    on(name, fn) {return this.owner?.on(name, fn);}
}

export { EventHandle };