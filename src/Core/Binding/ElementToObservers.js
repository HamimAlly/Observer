import { BindingBase } from './Base.js';

class BindingElementToObservers extends BindingBase
{
    clone()
    {
        return new BindingElementToObservers({
            history: this._history,
            historyPrefix: this._historyPrefix,
            historyPostfix: this._historyPostfix,
            historyName: this._historyName,
            historyCombine: this._historyCombine
        });
    }

    _getHistoryActionName(paths) {return `${this._historyPrefix || ''}${this._historyName || paths[0]}${this._historyPostfix || ''}`;}

    _setValue(value, isArrayOfValues)
    {
        if (this.applyingChange) return;
        if (!this._observers.length) return;

        this.applyingChange = true;

        const observers = this._observers.slice();
        const paths = this._paths.slice();
        const context = {observers, paths};

        const execute = () => {
            this._setValueToObservers(observers, paths, value, isArrayOfValues);
            this.emit('history:redo', context);
        };

        if (this._history)
        {
            let previousValues = [];

            if (observers.length === 1 && paths.length > 1)
            {
                previousValues = paths.map((path) => {return observers[0].has(path) ? observers[0].get(path) : undefined;});
            }

            else
            {
                previousValues = observers.map((observer, i) => {
                    const path = this._pathAt(paths, i);
                    return observer.has(path) ? observer.get(path) : undefined;
                });
            }

            this.emit('history:init', context);
            
            this._history.add({
                name: this._getHistoryActionName(paths),
                redo: execute,
                combine: this._historyCombine,
                undo: () => {
                    this._setValueToObservers(observers, paths, previousValues, true);
                    this.emit('history:undo', context);
                }
            });
        }
        
        execute();
        this.applyingChange = false;
    }

    _setValueToObservers(observers, paths, value, isArrayOfValues)
    {
        if (observers.length === 1 && paths.length > 1)
        {
            for (let i = 0; i < paths.length; i++)
            {
                const latest = observers[0].latest();
                if (!latest) continue;

                let history = false;

                if (latest.history)
                {
                    history = latest.history.enabled;
                    latest.history.enabled = false;
                }

                const path = paths[i];
                const val = value[i];

                if (value !== undefined) this._observerSet(latest, path, val);
                else latest.unset(path);

                if (history) latest.history.enabled = true;
            }

            return;
        }

        for (let i = 0; i < observers.length; i++)
        {
            const latest = observers[i].latest();
            if (!latest) continue;

            let history = false;

            if (latest.history)
            {
                history = latest.history.enabled;
                latest.history.enabled = false;
            }

            const path = this._pathAt(paths, i);
            const val = isArrayOfValues ? value[i] : value;

            if (value !== undefined) this._observerSet(latest, path, val);
            else latest.unset(path);

            if (history) latest.history.enabled = true;
        }
    }

    _observerSet(observer, path, value)
    {
        const lastIndexDot = path.lastIndexOf('.');
        if (lastIndexDot > 0 && !observer.has(path.substring(0, lastIndexDot))) return;

        const isArray = Array.isArray(value);
        observer.set(path, isArray && value ? value.slice() : value);
    }

    _addValues(values)
    {
        if (this.applyingChange) return;
        if (!this._observers) return;

        this.applyingChange = true;

        const observers = this._observers.slice();
        const paths = this._paths.slice();
        const records = [];

        for (let i = 0; i < observers.length; i++)
        {
            const path = this._pathAt(paths, i);
            const observer = observers[i];

            values.forEach((value) => {
                if (observer.get(path).indexOf(value) === -1)
                {
                    records.push({
                        observer: observer,
                        path: path,
                        value: value
                    });
                }
            });
        }

        const execute = () => {
            for (const record of records)
            {
                const latest = record.observer.latest();
                if (!latest) continue;

                const path = record.path;
                let history = false;

                if (latest.history)
                {
                    history = latest.history.enabled;
                    latest.history.enabled = false;
                }

                latest.insert(path, record.value);

                if (history) latest.history.enabled = true;
            }
        };

        if (this._history && records.length)
        {
            this._history.add({
                name: this._getHistoryActionName(paths),
                redo: execute,
                combine: this._historyCombine,
                undo: () => {
                    for (const record of records)
                    {
                        const latest = record.observer.latest();
                        if (!latest) continue;

                        const path = record.path;
                        let history = false;

                        if (latest.history)
                        {
                            history = latest.history.enabled;
                            latest.history.enabled = false;
                        }

                        latest.removeValue(path, record.value);

                        if (history) latest.history.enabled = true;
                    }
                }
            });
        }

        execute();
        this.applyingChange = false;
    }

    _removeValues(values)
    {
        if (this.applyingChange) return;
        if (!this._observers) return;

        this.applyingChange = true;
        
        const observers = this._observers.slice();
        const paths = this._paths.slice();
        const records = [];

        for (let i = 0; i < observers.length; i++)
        {
            const path = this._pathAt(paths, i);
            const observer = observers[i];

            values.forEach((value) => {
                const ind = observer.get(path).indexOf(value);

                if (ind !== -1)
                {
                    records.push({
                        observer: observer,
                        path: path,
                        value: value,
                        index: ind
                    });
                }
            });
        }

        const execute = () => {
            for (const record of records)
            {
                const latest = record.observer.latest();
                if (!latest) continue;

                const path = record.path;
                let history = false;

                if (latest.history)
                {
                    history = latest.history.enabled;
                    latest.history.enabled = false;
                }

                latest.removeValue(path, record.value);

                if (history) {latest.history.enabled = true;}
            }
        };

        if (this._history && records.length)
        {
            this._history.add({
                name: this._getHistoryActionName(paths),
                redo: execute,
                combine: this._historyCombine,
                undo: () => {
                    for (const record of records)
                    {
                        const latest = record.observer.latest();
                        if (!latest) continue;

                        const path = record.path;
                        let history = false;

                        if (latest.history)
                        {
                            history = latest.history.enabled;
                            latest.history.enabled = false;
                        }

                        if (latest.get(path).indexOf(record.value) === -1) {latest.insert(path, record.value, record.index);}
                        if (history) {latest.history.enabled = true;}
                    }
                }
            });
        }

        execute();
        this.applyingChange = false;
    }

    setValue(value) {this._setValue(value, false);}

    setValues(values)
    {
        values = values.slice().map(val => (Array.isArray(val) ? val.slice() : val));
        this._setValue(values, true);
    }

    addValue(value) {this._addValues([value]);}
    addValues(values) {this._addValues(values);}
    removeValue(value) {this._removeValues([value]);}
    removeValues(values) {this._removeValues(values);}
}

export { BindingElementToObservers };