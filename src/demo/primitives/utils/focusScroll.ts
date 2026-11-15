// Keyboard-aware, centered scroll-into-view utilities
// Usage:
//   import { isEditableElement, scheduleScrollIntoView } from '$demo/primitives/utils/focusScroll.js';
//   if (isEditableElement(el)) scheduleScrollIntoView(el);

export function isEditableElement(el: HTMLElement): boolean {
	const tag = el.tagName.toLowerCase();
	const isEditableTag = tag === 'input' || tag === 'textarea' || tag === 'select';
	const isContentEditable = el.isContentEditable || el.getAttribute('contenteditable') === 'true';
	const role = el.getAttribute('role');
	const isTextboxLike = role === 'textbox' || role === 'combobox' || role === 'searchbox';
	const isButtonLike = tag === 'button' || tag === 'a' || !!el.closest('[data-part="trigger"]');
	return (isEditableTag || isContentEditable || isTextboxLike) && !isButtonLike;
}

export type ScheduleScrollOptions = {
	behavior?: ScrollBehavior; // default: 'instant' (fallback to 'auto')
	block?: ScrollLogicalPosition; // default: 'center'
	inline?: ScrollLogicalPosition; // default: 'nearest'
	keyboardDelayMs?: number; // default: 350
	keyboardShrinkThresholdPx?: number; // default: 20
};

export function scheduleScrollIntoView(
	target: HTMLElement,
	options: ScheduleScrollOptions = {}
): void {
	const behavior = options.behavior ?? ('instant' as ScrollBehavior);
	const block = options.block ?? ('nearest' as ScrollLogicalPosition);
	const inline = options.inline ?? ('nearest' as ScrollLogicalPosition);
	const keyboardDelayMs = options.keyboardDelayMs ?? 350;
	const keyboardShrinkThresholdPx = options.keyboardShrinkThresholdPx ?? 20;

	const doScroll = () => {
		try {
			target.scrollIntoView({ behavior, block, inline });
		} catch {
			// Fallback for browsers that don't accept 'instant'
			target.scrollIntoView({ behavior: 'auto', block, inline });
		}
	};

	// Prefer visualViewport resize/scroll (keyboard opening) as a signal
	const vv: VisualViewport | undefined =
		typeof window !== 'undefined' ? (window.visualViewport ?? undefined) : undefined;

	if (vv) {
		const initialHeight = vv.height;
		let done = false;
		let onResize: (() => void) | null = null;
		let onScroll: (() => void) | null = null;

		const cleanup = () => {
			if (onResize) vv.removeEventListener('resize', onResize as EventListener);
			if (onScroll) vv.removeEventListener('scroll', onScroll as EventListener);
		};

		const timeout = setTimeout(() => {
			if (done) return;
			done = true;
			cleanup();
			// rAF twice to allow layout/viewport settling
			requestAnimationFrame(() => requestAnimationFrame(doScroll));
		}, keyboardDelayMs);

		onResize = () => {
			if (done) return;
			const shrunk = vv.height < initialHeight - keyboardShrinkThresholdPx;
			if (shrunk) {
				done = true;
				cleanup();
				clearTimeout(timeout);
				requestAnimationFrame(() => requestAnimationFrame(doScroll));
			}
		};
		vv.addEventListener('resize', onResize, { once: false });

		onScroll = () => {
			if (done) return;
			done = true;
			cleanup();
			clearTimeout(timeout);
			requestAnimationFrame(() => requestAnimationFrame(doScroll));
		};
		vv.addEventListener('scroll', onScroll, { once: true });
	} else {
		// Fallback: defer a bit and then scroll
		requestAnimationFrame(() => requestAnimationFrame(doScroll));
	}
}
