import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';

@Directive({
  selector: '[scrollDirective]',
})
export class ScrollDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const host = this.el.nativeElement;
      let stickToBottom = true;

      const scrollToBottom = () => {
        host.scrollTop = host.scrollHeight;
      };

      const onScroll = () => {
        stickToBottom =
          host.scrollHeight - host.scrollTop - host.clientHeight < 40;
      };

      host.addEventListener('scroll', onScroll, { passive: true });

      const observer = new MutationObserver(() => {
        if (stickToBottom) scrollToBottom();
      });

      observer.observe(host, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      scrollToBottom();

      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        host.removeEventListener('scroll', onScroll);
      });
    });
  }
}
