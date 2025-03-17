import { Element } from '../Element/index.js';
import { TextInput } from '../TextInput/index.js';

const CLASS_TEXT_AREA_INPUT = 'text-area-input';
const CLASS_TEXT_AREA_INPUT_RESIZABLE = `${CLASS_TEXT_AREA_INPUT}-resizable`;
const CLASS_TEXT_AREA_INPUT_RESIZABLE_NONE = `${CLASS_TEXT_AREA_INPUT_RESIZABLE}-none`;
const CLASS_TEXT_AREA_INPUT_RESIZABLE_BOTH = `${CLASS_TEXT_AREA_INPUT_RESIZABLE}-both`;
const CLASS_TEXT_AREA_INPUT_RESIZABLE_HORIZONTAL = `${CLASS_TEXT_AREA_INPUT_RESIZABLE}-horizontal`;
const CLASS_TEXT_AREA_INPUT_RESIZABLE_VERTICAL = `${CLASS_TEXT_AREA_INPUT_RESIZABLE}-vertical`;

class TextAreaInput extends TextInput
{
    constructor(args = {})
    {
        args = Object.assign({input: document.createElement('textarea')}, args);
        super(args);
        
        this.class.add(CLASS_TEXT_AREA_INPUT);

        switch (args.resizable)
        {
            case 'both':
                this.class.add(CLASS_TEXT_AREA_INPUT_RESIZABLE_BOTH);
                break;

            case 'horizontal':
                this.class.add(CLASS_TEXT_AREA_INPUT_RESIZABLE_HORIZONTAL);
                break;

            case 'vertical':
                this.class.add(CLASS_TEXT_AREA_INPUT_RESIZABLE_VERTICAL);
                break;

            case 'none':

            default:
                this.class.add(CLASS_TEXT_AREA_INPUT_RESIZABLE_NONE);
                break;
        }
    }
    _onInputKeyDown(evt)
    {
        if ((evt.key === 'Escape' && this.blurOnEscape) || (evt.key === 'Enter' && this.blurOnEnter && !evt.shiftKey)) this._domInput.blur();
        this.emit('keydown', evt);
    }
}

Element.register('text', TextAreaInput, { renderChanges: true });

export { TextAreaInput };