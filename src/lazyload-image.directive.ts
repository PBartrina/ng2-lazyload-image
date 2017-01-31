import 'rxjs/add/operator/let';
import { Directive, ElementRef, Input, NgZone } from '@angular/core';
import { isBrowser } from 'angular2-universal';
import { getScrollListener } from './scroll-listener';
import { lazyLoadImage } from './lazyload-image';

@Directive({
    selector: '[lazyLoad]'
})
export class LazyLoadImageDirective {
    @Input('lazyLoad') lazyImage;   // The image to be lazy loaded
    @Input() errorImage: string;    // The image to be displayed if lazyImage load fails
    @Input() src: string;
    @Input() scrollTarget: any; // Chnage the node we should listen for scroll events on, default is window
    @Input() scrollObservable;      // Pass your own scroll emitter
    @Input() offset: number;        // The number of px a image should be loaded before it is in view port
    elementRef: ElementRef;
    ngZone: NgZone;
    scrollSubscription;

    constructor(el: ElementRef, ngZone: NgZone) {
        this.elementRef = el;
        this.ngZone = ngZone;
        this.scrollTarget = ( isBrowser ) ? window : null;
    }

    ngAfterContentInit() {
        // There is no need to add an scroll event listener on an unexistant target
        if ( isBrowser ) {
            this.ngZone.runOutsideAngular(() => {
                if (this.scrollObservable) {
                    this.scrollSubscription = this.scrollObservable
                        .startWith('')
                        .let(lazyLoadImage(this.elementRef.nativeElement, this.lazyImage, this.errorImage, this.offset))
                        .subscribe(() => {});
                } else {
                    this.scrollSubscription = getScrollListener(this.scrollTarget)
                        .let(lazyLoadImage(this.elementRef.nativeElement, this.lazyImage, this.errorImage, this.offset))
                        .subscribe(() => {});
                }
            });
        } else {
            lazyLoadImage(this.elementRef.nativeElement, this.lazyImage, this.errorImage, this.offset);
        }
    }

    ngOnDestroy() {
        [this.scrollSubscription]
            .filter(subscription => subscription && !subscription.isUnsubscribed)
            .forEach(subscription => subscription.unsubscribe());
    }
}
