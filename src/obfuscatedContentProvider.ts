'use strict';

import {TextDocumentContentProvider, EventEmitter, Uri, Disposable} from 'vscode';
import {workspace, window, TextDocument} from 'vscode';
import ObfuscatedDocument from './obfuscatedDocument';

// This provider allows to display the obfuscated content in a separate
// read-only editor pane
export default class ObfuscatedContentProvider implements TextDocumentContentProvider {
	// --- We use the JavaScript scheme for proper syntax highlighting
	static scheme = 'javascript';

	private _onDidChange = new EventEmitter<Uri>();
	private _documents = new Map<string, ObfuscatedDocument>();
	private _subscriptions: Disposable;

	constructor() {
		this._subscriptions = workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()));
	}

    // Let's dispose all used resource when the content provider gets disposed
	dispose() {
		this._subscriptions.dispose();
		this._documents.clear();
		this._onDidChange.dispose();
	}

	// We implement TextDocumentContentProvider.onDidChange to specify how
	// to respond to document changes
	get onDidChange() {
		return this._onDidChange.event;
	}

	// We implement TextDocumentContentProvider.provideTextDocumentContent to
	// specify the obfuscated content 
	provideTextDocumentContent(uri: Uri): string | Thenable<string> {
		// --- Is this document already loaded?
		let document = this._documents.get(uri.toString());
		if (document) {
			return document.obfuscatedText;
		}
		document = new ObfuscatedDocument(window.activeTextEditor.document);
		this._documents.set(uri.toString(), document);
		return document.obfuscatedText;
	}
}

// Creates the uri that represents the obfuscated form op the document.
export function encodeLocation(document: TextDocument): Uri {
	return Uri.parse(`${ObfuscatedContentProvider.scheme}:${document.uri}`);
}