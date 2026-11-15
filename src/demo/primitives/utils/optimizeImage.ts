export interface OptimizeImageOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	maxSizeKB?: number;
	format?: 'webp' | 'jpeg' | 'jpg' | 'png';
	forceConvert?: boolean;
}

export async function optimizeImage(file: File, options: OptimizeImageOptions = {}): Promise<File> {
	// Check if we're in a browser environment
	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		return optimizeImageBrowser(file, options);
	} else {
		// For server-side, we just return the file as-is
		return file;
		// return optimizeImageServer(file, options);
	}
}

async function optimizeImageBrowser(file: File, options: OptimizeImageOptions = {}): Promise<File> {
	const {
		maxWidth = 800,
		maxHeight = 800,
		quality = 0.8,
		maxSizeKB = 800,
		format = 'webp',
		forceConvert = true
	} = options;

	// Skip resizing but still convert format if file is small enough
	const needsResize = file.size > maxSizeKB * 1024;

	// Skip processing entirely if file is already in target format and small enough
	if (!needsResize && !forceConvert && file.type === `image/${format}`) {
		return file;
	}

	// Create image from file
	const img = document.createElement('img');
	const imgUrl = URL.createObjectURL(file);

	// Wait for image to load
	await new Promise((resolve, reject) => {
		img.onload = resolve;
		img.onerror = reject;
		img.src = imgUrl;
	});

	// Calculate new dimensions while maintaining aspect ratio
	let width = img.width;
	let height = img.height;

	if (needsResize && (width > maxWidth || height > maxHeight)) {
		const aspectRatio = width / height;

		if (width > height) {
			width = maxWidth;
			height = Math.round(width / aspectRatio);
		} else {
			height = maxHeight;
			width = Math.round(height * aspectRatio);
		}
	}

	// Create canvas and draw resized image
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Could not get canvas context');
	}

	ctx.drawImage(img, 0, 0, width, height);
	URL.revokeObjectURL(imgUrl); // Clean up

	// Convert to blob with target format and quality
	const mimeType = `image/${format}`;

	// Start with initial quality
	let currentQuality = quality;
	let blob: Blob;

	// Try progressive compression if needed until we get under max size
	do {
		blob = await new Promise<Blob>((resolve) => {
			canvas.toBlob((result) => resolve(result as Blob), mimeType, currentQuality);
		});

		// Reduce quality for next iteration if still too large
		currentQuality *= 0.9;
	} while (needsResize && blob.size > maxSizeKB * 1024 && currentQuality > 0.1);

	// Create new file from blob
	return new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), { type: mimeType });
}
