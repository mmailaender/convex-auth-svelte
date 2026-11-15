// zxcvbn with its English and common word lists. Import this module only with `import()` from
// browser code (see `passwordStrength.ts`): a static import puts it in the server bundle.
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import type { PasswordChecker } from './passwordStrength';

export const passwordChecker: PasswordChecker = new ZxcvbnFactory({
	translations: zxcvbnEnPackage.translations,
	graphs: zxcvbnCommonPackage.adjacencyGraphs,
	dictionary: {
		...zxcvbnCommonPackage.dictionary,
		...zxcvbnEnPackage.dictionary
	}
});
