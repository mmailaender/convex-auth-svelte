import type { AvatarRootProps, DialogContentProps } from '@ark-ui/svelte';
import type { Snippet } from 'svelte';
import type { CropperProps } from 'svelte-easy-crop';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

/** Add a `children` snippet prop (optionale Args via Tupel). */
export type WithChildren<T, A extends unknown[] = []> = T & {
	children?: Snippet<A>;
};

/** Add a `child` snippet prop (optionale Args via Tupel). */
export type WithChild<T, A extends unknown[] = []> = T & {
	child?: Snippet<A>;
};

/** Remove a `children` prop from a type. */
export type WithoutChildren<T> = Omit<T, 'children'>;

/** Remove a `child` prop from a type. */
export type WithoutChild<T> = Omit<T, 'child'>;

export type ImageCropperRootPropsWithoutHTML = WithChildren<{
	id?: string;
	src?: string;
	onCropped?: (url: string) => void;
	onUnsupportedFile?: (file: File) => void;
}>;

export type ImageCropperRootProps = ImageCropperRootPropsWithoutHTML & HTMLInputAttributes;

export type ImageCropperDialogProps = DialogContentProps;

export type ImageCropperCropperProps = Omit<Partial<CropperProps>, 'oncropcomplete' | 'image'>;

export type ImageCropperControlsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
}>;

export type ImageCropperControlsProps = ImageCropperControlsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;

export type ImageCropperPreviewPropsWithoutHTML = {
	child?: Snippet<[{ src: string }]>;
};

export type ImageCropperPreviewProps = ImageCropperPreviewPropsWithoutHTML &
	WithoutChild<AvatarRootProps>;

export type ImageCropperUploadTriggerPropsWithoutHTML = WithChildren<{
	ref?: HTMLLabelElement | null;
}>;

export type ImageCropperUploadTriggerProps = ImageCropperUploadTriggerPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLLabelElement>>;
