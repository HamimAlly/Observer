import { CLASS_RESIZABLE, CLASS_FLEX, CLASS_GRID, CLASS_SCROLLABLE } from '../../class.js';
import { Element } from '../Element/index.js';

const RESIZE_HANDLE_SIZE = 4;
const VALID_RESIZABLE_VALUES = [
    null,
    'top',
    'right',
    'bottom',
    'left'
];

const CLASS_RESIZING = `${CLASS_RESIZABLE}-resizing`;
const CLASS_RESIZABLE_HANDLE = 'resizable-handle';
const CLASS_CONTAINER = 'container';
const CLASS_DRAGGED = `${CLASS_CONTAINER}-dragged`;
const CLASS_DRAGGED_CHILD = `${CLASS_DRAGGED}-child`;

class Container extends Element
{
    static EVENT_APPEND = 'append';
    static EVENT_REMOVE = 'remove';
    static EVENT_SCROLL = 'scroll';
    static EVENT_RESIZE = 'resize';
    
    constructor(args = {})
    {
        super(args);
        
        this._scrollable = false;
        this._flex = false;
        this._grid = false;
        this._domResizeHandle = null;
        this._resizePointerId = null;
        this._resizeData = null;
        this._resizeHorizontally = true;
        this._resizeMin = 100;
        this._resizeMax = 300;
        this._draggedStartIndex = -1;
        this._onScroll = (evt) => {this.emit('scroll', evt);};
        
        this._onResizeStart = (evt) => {
            if (this._resizePointerId !== null) return;
            evt.preventDefault();
            evt.stopPropagation();
            this._domResizeHandle.setPointerCapture(evt.pointerId);
            this._resizePointerId = evt.pointerId;
            this._resizeStart();
        };

        this._onResizeMove = (evt) => {
            if (this._resizePointerId !== evt.pointerId) return;
            evt.preventDefault();
            evt.stopPropagation();
            this._resizeMove(evt.clientX, evt.clientY);
        };

        this._onResizeEnd = (evt) => {
            if (this._resizePointerId !== evt.pointerId) return;
            evt.preventDefault();
            evt.stopPropagation();
            this._resizeEnd();
            this._domResizeHandle.releasePointerCapture(evt.pointerId);
            this._resizePointerId = null;
        };

        this.class.add(CLASS_CONTAINER);
        this.domContent = this._dom;

        if (args.scrollable) this.scrollable = true;

        this.flex = !!args.flex;
        let grid = !!args.grid;

        if (grid)
        {
            if (this.flex)
            {
                console.error('Invalid Container arguments: "grid" and "flex" cannot both be true.');
                grid = false;
            }
        }
        
        this.grid = grid;

        this.resizable = args.resizable !== null && args.resizable !== void 0 ? args.resizable : null;
        if (args.resizeMin !== undefined) this.resizeMin = args.resizeMin;
        if (args.resizeMax !== undefined) this.resizeMax = args.resizeMax;
    }

    destroy()
    {
        if (this._destroyed) return;

        this.domContent = null;

        if (this._domResizeHandle)
        {
            this._domResizeHandle.removeEventListener('pointerdown', this._onResizeStart);
            this._domResizeHandle.removeEventListener('pointermove', this._onResizeMove);
            this._domResizeHandle.removeEventListener('pointerup', this._onResizeEnd);
        }

        super.destroy();
    }

    append(element)
    {
        const dom = this._getDomFromElement(element);
        this._domContent.appendChild(dom);
        this._onAppendChild(element);
    }

    appendBefore(element, referenceElement)
    {
        const dom = this._getDomFromElement(element);
        this._domContent.appendChild(dom);
        const referenceDom = referenceElement && this._getDomFromElement(referenceElement);
        this._domContent.insertBefore(dom, referenceDom);
        this._onAppendChild(element);
    }

    appendAfter(element, referenceElement)
    {
        const dom = this._getDomFromElement(element);
        const referenceDom = referenceElement && this._getDomFromElement(referenceElement);
        const elementBefore = referenceDom ? referenceDom.nextSibling : null;
        if (elementBefore) this._domContent.insertBefore(dom, elementBefore);
        else this._domContent.appendChild(dom);
        this._onAppendChild(element);
    }

    prepend(element)
    {
        const dom = this._getDomFromElement(element);
        const first = this._domContent.firstChild;
        if (first) this._domContent.insertBefore(dom, first);
        else this._domContent.appendChild(dom);
        this._onAppendChild(element);
    }

    remove(element)
    {
        if (element.parent !== this) return;
        const dom = this._getDomFromElement(element);
        this._domContent.removeChild(dom);
        this._onRemoveChild(element);
    }

    move(element, index)
    {
        const idx = Array.prototype.indexOf.call(this.dom.childNodes, element.dom);
        if (idx === -1) this.appendBefore(element, this.dom.childNodes[index]);

        else if (index !== idx)
        {
            this.remove(element);
            if (index < idx) this.appendBefore(element, this.dom.childNodes[index]);
            else this.appendAfter(element, this.dom.childNodes[index - 1]);
        }
    }

    clear()
    {
        let i = this._domContent.childNodes.length;

        while (i--)
        {
            const node = this._domContent.childNodes[i];
            if (node.ui && node.ui !== this) {node.ui.destroy();}
        }

        if (this._domResizeHandle)
        {
            this._domResizeHandle.removeEventListener('pointerdown', this._onResizeStart);
            this._domResizeHandle.removeEventListener('pointermove', this._onResizeMove);
            this._domResizeHandle.removeEventListener('pointerup', this._onResizeEnd);
            this._domResizeHandle = null;
        }
        
        this._domContent.innerHTML = '';

        if (this.resizable)
        {
            this._createResizeHandle();
            this._dom.appendChild(this._domResizeHandle);
        }
    }

    _getDomFromElement(element)
    {
        if (element.dom) return element.dom;
        if (element.element) { return element.element;}
        return element;
    }

    _onAppendChild(element)
    {
        element.parent = this;
        this.emit('append', element);
    }

    _onRemoveChild(element)
    {
        element.parent = null;
        this.emit('remove', element);
    }

    _createResizeHandle()
    {
        const handle = document.createElement('div');
        handle.classList.add(CLASS_RESIZABLE_HANDLE);
        handle.ui = this;
        handle.addEventListener('pointerdown', this._onResizeStart);
        handle.addEventListener('pointermove', this._onResizeMove);
        handle.addEventListener('pointerup', this._onResizeEnd);
        this._domResizeHandle = handle;
    }

    _resizeStart() {this.class.add(CLASS_RESIZING);}

    _resizeMove(x, y)
    {
        if (!this._resizeData)
        {
            this._resizeData = {
                x: x,
                y: y,
                width: this.dom.clientWidth,
                height: this.dom.clientHeight
            };

            return;
        }

        if (this._resizeHorizontally)
        {
            let offsetX = this._resizeData.x - x;
            if (this._resizable === 'right') offsetX = -offsetX;
            this.width = RESIZE_HANDLE_SIZE + Math.max(this._resizeMin, Math.min(this._resizeMax, (this._resizeData.width + offsetX)));
        }

        else
        {
            let offsetY = this._resizeData.y - y;
            if (this._resizable === 'bottom') offsetY = -offsetY;
            this.height = Math.max(this._resizeMin, Math.min(this._resizeMax, (this._resizeData.height + offsetY)));
        }

        this.emit('resize');
    }

    _resizeEnd()
    {
        this._resizeData = null;
        this.class.remove(CLASS_RESIZING);
    }

    resize(x = 0, y = 0)
    {
        this._resizeStart();
        this._resizeMove(0, 0);
        this._resizeMove(-x + RESIZE_HANDLE_SIZE, -y);
        this._resizeEnd();
    }

    _getDraggedChildIndex(draggedChild)
    {
        for (let i = 0; i < this.dom.childNodes.length; i++) if (this.dom.childNodes[i].ui === draggedChild) return i;
        return -1;
    }

    _onChildDragStart(evt, childPanel)
    {
        this.class.add(CLASS_DRAGGED_CHILD);
        this._draggedStartIndex = this._getDraggedChildIndex(childPanel);
        childPanel.class.add(CLASS_DRAGGED);
        this.emit('child:dragstart', childPanel, this._draggedStartIndex);
    }

    _onChildDragMove(evt, childPanel)
    {
        const rect = this.dom.getBoundingClientRect();
        const dragOut = (evt.clientX < rect.left || evt.clientX > rect.right || evt.clientY < rect.top || evt.clientY > rect.bottom);
        const childPanelIndex = this._getDraggedChildIndex(childPanel);
        
        if (dragOut)
        {
            childPanel.class.remove(CLASS_DRAGGED);

            if (this._draggedStartIndex !== childPanelIndex)
            {
                this.remove(childPanel);

                if (this._draggedStartIndex < childPanelIndex) {this.appendBefore(childPanel, this.dom.childNodes[this._draggedStartIndex]);}
                else {this.appendAfter(childPanel, this.dom.childNodes[this._draggedStartIndex - 1]);}
            }

            return;
        }

        childPanel.class.add(CLASS_DRAGGED);

        const y = evt.clientY - rect.top;
        let ind = null;

        for (let i = 0; i < this.dom.childNodes.length; i++)
        {
            const otherPanel = this.dom.childNodes[i].ui;
            const otherTop = otherPanel.dom.offsetTop;

            if (i < childPanelIndex)
            {
                if (y <= otherTop + otherPanel.header.height)
                {
                    ind = i;
                    break;
                }
            }

            else if (i > childPanelIndex)
            {
                if (y + childPanel.height >= otherTop + otherPanel.height)
                {
                    ind = i;
                    break;
                }
            }
        }

        if (ind !== null && childPanelIndex !== ind)
        {
            this.remove(childPanel);

            if (ind < childPanelIndex) this.appendBefore(childPanel, this.dom.childNodes[ind]);
            else this.appendAfter(childPanel, this.dom.childNodes[ind - 1]);
        }
    }

    _onChildDragEnd(evt, childPanel)
    {
        this.class.remove(CLASS_DRAGGED_CHILD);
        childPanel.class.remove(CLASS_DRAGGED);
        const index = this._getDraggedChildIndex(childPanel);
        this.emit('child:dragend', childPanel, index, this._draggedStartIndex);
        this._draggedStartIndex = -1;
    }

    forEachChild(fn)
    {
        for (let i = 0; i < this.dom.childNodes.length; i++)
        {
            const node = this.dom.childNodes[i].ui;
            if (node)
            {
                const result = fn(node, i);
                if (result === false) break;
            }
        }
    }

    _buildDomNode(node)
    {
        const keys = Object.keys(node);
        let rootNode;

        if (keys.includes('root'))
        {
            rootNode = this._buildDomNode(node.root);
            node.children.forEach((childNode) => {
                const childNodeElement = this._buildDomNode(childNode);
                if (childNodeElement !== null) rootNode.append(childNodeElement);
            });
        }

        else
        {
            rootNode = node[keys[0]];
            this[`_${keys[0]}`] = rootNode;
        }

        return rootNode;
    }

    buildDom(dom)
    {
        dom.forEach((node) => {
            const builtNode = this._buildDomNode(node);
            this.append(builtNode);
        });
    }

    set flex(value)
    {
        if (value === this._flex) return;
        this._flex = value;

        if (value) this.class.add(CLASS_FLEX);
        else this.class.remove(CLASS_FLEX);
    }

    get flex() {return this._flex;}

    set grid(value)
    {
        if (value === this._grid) return;
        this._grid = value;

        if (value) this.class.add(CLASS_GRID);
        else this.class.remove(CLASS_GRID);
    }

    get grid() {return this._grid;}

    set scrollable(value)
    {
        if (this._scrollable === value) return;
        this._scrollable = value;
        if (value) this.class.add(CLASS_SCROLLABLE);
        else this.class.remove(CLASS_SCROLLABLE);
    }

    get scrollable() {return this._scrollable;}

    set resizable(value)
    {
        if (value === this._resizable) return;

        if (VALID_RESIZABLE_VALUES.indexOf(value) === -1)
        {
            console.error(`Invalid resizable value: must be one of ${VALID_RESIZABLE_VALUES.join(',')}`);
            return;
        }

        if (this._resizable) this.class.remove(`${CLASS_RESIZABLE}-${this._resizable}`);
    
        this._resizable = value;
        this._resizeHorizontally = (value === 'right' || value === 'left');

        if (value)
        {
            this.class.add(CLASS_RESIZABLE);
            this.class.add(`${CLASS_RESIZABLE}-${value}`);
            if (!this._domResizeHandle) this._createResizeHandle();
            this._dom.appendChild(this._domResizeHandle);
        }

        else
        {
            this.class.remove(CLASS_RESIZABLE);
            if (this._domResizeHandle) this._dom.removeChild(this._domResizeHandle);
        }
    }

    get resizable() {return this._resizable;}

    set resizeMin(value) {this._resizeMin = Math.max(0, Math.min(value, this._resizeMax));}
    get resizeMin() {return this._resizeMin;}

    set resizeMax(value) {this._resizeMax = Math.max(this._resizeMin, value);}
    get resizeMax() {return this._resizeMax;}

    set domContent(value)
    {
        if (this._domContent === value)return;
        if (this._domContent) this._domContent.removeEventListener('scroll', this._onScroll);
        this._domContent = value;
        if (this._domContent) this._domContent.addEventListener('scroll', this._onScroll);
    }

    get domContent() {return this._domContent;}
}

Element.register('container', Container);

export { Container };