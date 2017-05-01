'use strict';

import { ExtensionContext, Disposable, commands, workspace, window } from 'vscode';
import ObfuscatedDocument from './obfuscatedDocument';
import ObfuscatedContentProvider, { encodeLocation } from './obfuscatedContentProvider';

// This code activates the obfuscator component
export function activate(context: ExtensionContext) {

	const provider = new ObfuscatedContentProvider();

	// --- Our extension uses ObfuscatedContentProvider to display a
    // --- virtual document, thus here we register it
	const providerRegistrations = Disposable.from(
		workspace.registerTextDocumentContentProvider(ObfuscatedContentProvider.scheme, provider)
	);

    // --- Our extension is bound to the activation of the 
    // --- 'preemptiveObfuscator.obfuscate' command, thus here we register the
    // --- command event handler
    let commandRegistration = commands.registerTextEditorCommand('preemptiveObfuscator.obfuscate', editor => {
        const uri = encodeLocation(editor.document);
		return workspace.openTextDocument(uri).then(doc => window.showTextDocument(doc, editor.viewColumn + 1))
    });

    // --- We sign that the shell should dispose the resources
    // --- held by the command registration whenever the shell
    // --- disposes our extension
    context.subscriptions.push(
        providerRegistrations,
        commandRegistration);
}

// We have nothing to do when this extension is deactivated
export function deactivate() {
}