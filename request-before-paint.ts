
/**
 * IMPORTANT to be careful NOT to do any DOM or style manipulations in this callback
 * or you will cause style recalcs and layout recalcs for the second time in the frame
 * This runs after everything except observer callbacks and paint
 * So only do webgl/canvas or reads from state
 * Layout is already calc'd so things like getBoundingClientRect should be free
 *
 * If you update an observed property it may trigger React re-renders
 * which will cause layout recalcs - useDeferredValue in React is one way to avoid this
 *
 * This class adds a div to the DOM and resizes it in every RAF so that we will always get
 * a ResizeObserver callback - which happens after layout is calculated but before paint
 * This is a great time to measure DOM changes and draw to canvas/WebGL to keep them in sync
 */
class RequestBeforePaint {
    #targetElem: HTMLDivElement | null = null;
    #observer: ResizeObserver | null = null;
  
    constructor(callback: () => void) {
      // Create minimal target element
      this.#targetElem = document.createElement('div');
      this.#targetElem.style.cssText = [
        'position:fixed',
        'width:1px',
        'height:1px',
        'right:0',
        'bottom:0',
        'pointer-events:none',
        'contain:strict',
        'z-index:-999',
        'visibility:hidden',
      ].join(';');
      document.body.appendChild(this.#targetElem);
  
      // Start our loop that will resize the div in every frame
      requestAnimationFrame(this.update);
  
      // Wait to create the RO until after syncronously-created-ROs from app code have run (hopefully placing these callbacks last)
      Promise.resolve().then(() => {
        this.#observer = new ResizeObserver(callback);
  
        this.#observer.observe(this.#targetElem!);
      });
    }
  
    lastIndex = 0;
    values = ['1px', '2px'];
    update = () => {
      if (!this.#targetElem) return;
  
      this.#targetElem.style.width = this.values[this.lastIndex]!;
      this.lastIndex = this.lastIndex === 1 ? 0 : 1;
  
      requestAnimationFrame(this.update);
    };
  
    dispose = () => {
      if (this.#observer) {
        this.#observer.disconnect();
        this.#observer = null;
      }
      if (this.#targetElem && this.#targetElem.parentNode) {
        this.#targetElem.remove();
      }
      this.#targetElem = null;
    };
  }
  