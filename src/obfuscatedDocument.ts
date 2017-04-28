'use strict';

import { Uri } from 'vscode';

export default class ObfuscatedDocument {

	constructor(private _uri: Uri, private _content: string) {
	}

	get value() {
		return this._content;
	}
}
