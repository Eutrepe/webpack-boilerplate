import 'whatwg-fetch';
import 'element-closest-polyfill';
import 'intersection-observer';
(() => {
    templatePolyfill();
    edgePolyfill();
})();

function templatePolyfill(): boolean {
    if ('content' in document.createElement('template')) {
        return false;
    }
    const templates: HTMLCollectionOf < HTMLTemplateElement > = document.getElementsByTagName(
        `template`,
    );
    Array.from(templates).forEach((template: HTMLTemplateElement) => {
        const content = template.childNodes;
        const fragment = document.createDocumentFragment();
        while (content[0]) {
            fragment.appendChild(content[0]);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (template as any).content = fragment;
    });
    return true;
}

function edgePolyfill(): void {
    if (
        window &&
        'IntersectionObserver' in window &&
        'IntersectionObserverEntry' in window &&
        // tslint:disable-next-line: no-string-literal
        'intersectionRatio' in window['IntersectionObserverEntry']['prototype'] &&
        !('isIntersecting' in IntersectionObserverEntry.prototype)
    ) {
        // tslint:disable-next-line: no-string-literal
        Object.defineProperty(window['IntersectionObserverEntry']['prototype'], 'isIntersecting', {
            get(): boolean {
                return this.intersectionRatio > 0;
            },
        });
    }
}