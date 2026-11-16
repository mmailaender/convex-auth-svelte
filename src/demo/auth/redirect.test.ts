import { describe, expect, it } from 'vitest';
import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
	it('keeps a path on this site', () => {
		expect(safeRedirect('/product?tab=chat#top')).toBe('/product?tab=chat#top');
	});

	it('falls back without a value', () => {
		expect(safeRedirect(null, '/home')).toBe('/home');
		expect(safeRedirect('', '/home')).toBe('/home');
	});

	it.each([
		'https://evil.com',
		'evil.com',
		'//evil.com',
		'/\\evil.com',
		'/\t/evil.com',
		'/\n/evil.com',
		'/\r\n/evil.com',
		'\t//evil.com',
		'javascript:alert(1)'
	])('refuses %j, which leaves the site', (redirectTo) => {
		expect(safeRedirect(redirectTo, '/home')).toBe('/home');
	});
});
