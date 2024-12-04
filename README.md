# requestBeforePaint

## Example usage

I'm not publishing to npm for now so just copy/paste from `request-before-paint.ts` into your codebase.

```
// Get a callback after layout but before paint on every frame
const onBeforePaint = new RequestBeforePaint(() => {
    // Grab the updated size of an HTML element
    const rect = someHtmlElem.getBoundingClientRect();

    // Draw to canvas, perfectly in frame-sync
    someCanvasCtx.strokeRect(rect.x, rect.y, rect.width, rect.height)
});



// When finished
onBeforePaint.dispose();
```

**Caution** if you change anything about the DOM in the requestBeforePaint (layout, styles, elements, cause React to re-render etc) it will cause the browser do another round of style and layout calculations for the same frame. The intent is to only do drawing side effects like canvas draw calls with this function.


## The problem
It's very difficult to measure DOM and then draw to Canvas 2D or WebGL during the same frame. This leads to most tools being one frame behind DOM in their WebGL drawings.

The order that browsers handle things is roughly:
1. requestAnimationFrame callbacks
2. style updates
3. layout calculations
4. painting the frame

So if you measure a DOM element in a RAF, you're actually working with the previous frame's layout.

Ideally, browsers would give a "requestBeforePaint" type callback that would fire after layout is calculated but before paint happens. But they don't.

The only way I know to run your own code between steps 3 and 4 above is with ResizeObserver callbacks.

Side quest fun facts:
- IntersectionObserver usually runs its callbacks AFTER paint
- MutationObserver runs callbacks as they mutations are observed, so usually mixed into the RAF stage

So this repo puts a hidden 1px by 1px div on the screen and uses a RAF to resize it every frame. This triggers a ResizeObserver which gives you a handy callback after layout but before paint to take updated DOM measurements and do canvas draw calls that are synced with DOM.

**Bonus** Because layout was just calculated, reading DOM like `getBoundingClientBox` should be "free". I'm doing a couple hundred at a time and my callback is measured under half a millisecond. I haven't thoroughly tested this so please test it for yourself too.
