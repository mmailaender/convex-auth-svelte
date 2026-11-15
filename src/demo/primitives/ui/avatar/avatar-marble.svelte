<!-- AvatarMarble.svelte -->
<script lang="ts">
	// Utility functions
	const getNumber = (name: string) => {
		return Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
	};

	const getUnit = (number: number, range: number, index?: number) => {
		let value = number % range;
		if (index && Math.floor((number / Math.pow(10, index)) % 10) % 2 === 0) {
			return -value;
		}
		return value;
	};

	const getRandId = (prefix?: string) => {
		return (prefix || '') + Math.random().toString(36).substring(2);
	};

	import { cn } from '$demo/primitives/utils.js';

	// Props
	interface Props {
		size?: number;
		name?: string;
		colors?: string[];
		class?: string;
	}

	let {
		size = 80,
		name = '',
		colors = [
			'var(--color-primary-900)',
			'var(--color-secondary-200)',
			'var(--color-tertiary-200)'
		],
		class: className = ''
	}: Props = $props();

	// Constants
	const ELEMENTS = 3;
	const SIZE = 80;

	// Use fallback name for pattern generation if no name provided
	const nameForPattern = $derived(name || 'Anonymous');

	// Generate properties based on name
	const numFromName = $derived(getNumber(nameForPattern));

	const properties = Array.from({ length: ELEMENTS }, (_, i) => ({
		colorIndex: (numFromName + i) % colors.length,
		translateX: getUnit(numFromName * (i + 1), SIZE / 10, 1),
		translateY: getUnit(numFromName * (i + 1), SIZE / 10, 2),
		scale: 1.2 + getUnit(numFromName * (i + 1), SIZE / 20) / 10,
		rotate: getUnit(numFromName * (i + 1), 360, 1)
	}));

	// Generate initials only if name is provided
	const initials = $derived.by(() => {
		if (!name) return '';
		return name
			.split(' ')
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2); // Limit to 2 characters
	});

	// Generate unique IDs
	const maskId = getRandId('mask__marble');
	const filterId = getRandId('filter__marble');
</script>

<svg
	viewBox="0 0 {SIZE} {SIZE}"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	data-testid="avatar-marble"
	class={cn('rounded-full', className)}
	style="--color-0: {colors[properties[0].colorIndex]}; --color-1: {colors[
		properties[1].colorIndex
	]}; --color-2: {colors[properties[2].colorIndex]};"
>
	<defs>
		<mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={SIZE} height={SIZE}>
			<rect width={SIZE} height={SIZE} fill="white" />
		</mask>
		<filter id={filterId} filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
			<feFlood flood-opacity="0" result="BackgroundImageFix" />
			<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
			<feGaussianBlur stdDeviation="7" result="effect1_foregroundBlur" />
		</filter>
	</defs>

	<g mask="url(#{maskId})">
		<!-- Background -->
		<rect width={SIZE} height={SIZE} fill="var(--color-0)" />

		<!-- First overlay path -->
		<path
			filter="url(#{filterId})"
			style="mix-blend-mode: overlay; fill: var(--color-1);"
			d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
			transform="translate({properties[1].translateX} {properties[1]
				.translateY}) rotate({properties[1].rotate} {SIZE / 2} {SIZE / 2}) scale({properties[2]
				.scale})"
		/>

		<!-- Second overlay path -->
		<path
			filter="url(#{filterId})"
			style="fill: var(--color-2);"
			d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
			transform="translate({properties[2].translateX} {properties[2]
				.translateY}) rotate({properties[2].rotate} {SIZE / 2} {SIZE / 2}) scale({properties[2]
				.scale})"
		/>

		<!-- Conditionally render semi-transparent backdrop and initials only if name is provided -->
		{#if name}
			<!-- Semi-transparent backdrop for initials -->
			<rect
				width={SIZE}
				height={SIZE}
				fill="rgba(0, 0, 0, 0.25)"
				style="backdrop-filter: blur(2px);"
			/>

			<!-- Initials text -->
			<text
				x="50%"
				y="50%"
				dominant-baseline="central"
				text-anchor="middle"
				style="fill: white; font-family: system-ui, -apple-system, sans-serif; font-weight: 600; font-size: {SIZE *
					0.35}px;"
			>
				{initials}
			</text>
		{/if}
	</g>
</svg>
