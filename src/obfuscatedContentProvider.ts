'use strict';

import * as vscode from 'vscode';
import ObfuscatedDocument from './obfuscatedDocument';

export default class ObfuscatedContentProvider implements vscode.TextDocumentContentProvider {

	static scheme = 'javascript';

	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _documents = new Map<string, ObfuscatedDocument>();
	private _subscriptions: vscode.Disposable;

	constructor(private _obfuscator: () => string) {

		// Listen to the `closeTextDocument`-event which means we must
		// clear the corresponding model object - `ReferencesDocument`
		this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()));
	}

	dispose() {
		this._subscriptions.dispose();
		this._documents.clear();
		this._onDidChange.dispose();
	}

	get onDidChange() {
		return this._onDidChange.event;
	}

	provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {

		// already loaded?
		let document = this._documents.get(uri.toString());
		if (document) {
			return document.value;
		}

		document = new ObfuscatedDocument(uri, this._obfuscator());
		this._documents.set(uri.toString(), document);
		return document.value;
	}
}

let seq = 0;

export function encodeLocation(uri: vscode.Uri): vscode.Uri {
	const query = JSON.stringify(uri.toString());
	return vscode.Uri.parse(`${ObfuscatedContentProvider.scheme}:Obfuscated.js?${query}#${seq++}`);
}