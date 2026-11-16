import { goto } from '$app/navigation';

/** The search param that opens the profile dialog: `?dialog=profile`. */
export const PROFILE_DIALOG = 'profile';

/** Open or close the profile dialog by updating `?dialog=` of `url`. */
export function setProfileDialog(url: URL, open: boolean): Promise<void> {
	const next = new URL(url);
	if (open) next.searchParams.set('dialog', PROFILE_DIALOG);
	else next.searchParams.delete('dialog');
	return goto(next, { replaceState: !open, noScroll: true, keepFocus: true });
}
