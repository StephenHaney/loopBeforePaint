
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
 * This class triggers a ResizeObserver callback every frame - which happens after layout is calculated but before paint
 * This is a great time to measure DOM changes and draw to canvas/WebGL to keep them in sync
 */
class LoopBeforePaint {
  #dummyElem: HTMLDivElement | null = null;
  #observer: ResizeObserver | null = null;

  constructor(callback: () => void) {
    // Create dummy element to observe that will never resize other than when it is added or removed to the DOM
    this.#dummyElem = document.createElement('div');
    this.#dummyElem.style.cssText = [
      'position:fixed',
      'width:1px',
      'height:1px',
      'right:-1px',
      'bottom:-1px',
      'pointer-events:none',
      'contain:strict',
      'display:none',
    ].join(';');
    document.body.appendChild(this.#dummyElem);

    // Start our loop that will trigger a RO callback in every frame
    requestAnimationFrame(this.update);

    // Wait to create the RO until after syncronously-created-ROs from app code have run (hopefully placing these callbacks last)
    Promise.resolve().then(() => {
      this.#observer = new ResizeObserver(callback);

      this.#observer.observe(this.#dummyElem!);
    });
  }

  update = () => {
    if (!this.#dummyElem || !this.#observer) return;
    // cycling disconnect and observe is the fastest way to trigger a resize observer callback
    // much faster than resizing a div, which triggers browser layout calcs
    this.#observer.disconnect();
    this.#observer.observe(this.#dummyElem);

    requestAnimationFrame(this.update);
  };

  dispose = () => {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
    if (this.#dummyElem && this.#dummyElem.parentNode) {
      this.#dummyElem.remove();
    }
    this.#dummyElem = null;
  };
}
