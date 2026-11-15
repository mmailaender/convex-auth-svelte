<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';
	import { Portal as PortalPrimitive, type PortalProps } from '@ark-ui/svelte/portal';
	import type { Snippet } from 'svelte';
	import * as Dialog from './index.js';
	import { cn, type WithoutChildrenOrChild } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		// onInteractOutside,
		portalProps,
		positionerProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: PortalProps;
		positionerProps?: DialogPrimitive.PositionerProps;
		children: Snippet;
	} = $props();
</script>

<PortalPrimitive {...portalProps}>
	<Dialog.Backdrop />
	<DialogPrimitive.Positioner {...positionerProps}>
		<DialogPrimitive.Content
			bind:ref
			class={cn(
				'bg-surface-50-950 dark:bg-surface-100-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-container fixed top-1/2 left-1/2 z-50 flex w-[90%] -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-5 overflow-x-hidden overflow-y-auto p-5 duration-200',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</DialogPrimitive.Content>
	</DialogPrimitive.Positioner>
</PortalPrimitive>
