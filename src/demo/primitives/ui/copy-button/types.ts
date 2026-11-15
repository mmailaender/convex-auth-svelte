import type { Snippet } from 'svelte';
import type { UseClipboard } from '$demo/primitives/hooks/use-clipboard.svelte.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { WithChildren, WithoutChildren } from 'svelte-toolbelt';

export type CopyButtonPropsWithoutHTML = WithChildren<{
	ref?: HTMLButtonElement | null;
	text: string;
	icon?: Snippet<[]>;
	animationDuration?: number;
	onCopy?: (status: UseClipboard['status']) => void;
}>;

export type CopyButtonProps = CopyButtonPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLButtonElement>>;
