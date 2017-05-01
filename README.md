# vscode-jsobfuscator

This is a sample VS Code extension to demonstrate JavaScript code obfuscation.

## Getting Started
1. Clone the repository into your working folder
1. Execute `npm install` in the working folder
1. Open the working folder in Visual Studio Code
1. Press F5 (Start Debugging) in the IDE
1. A new Code instance, the Extension Development Host opens with the obfuscator extension installed. 
1. Create a new JavaScript file within this Code instance, right-click the text editor area, and then select the **Obfuscate Code** command from the context mwenu.
1. A new read-only editor pane appears with the obfuscated code. Alternatively, you can press Ctrl+Shift+P and search for the **Obfuscate Code** command in the Command Palette.

The obfuscation is based on the [javascript-obfuscator plugin](https://github.com/javascript-obfuscator/javascript-obfuscator).

## Code structure

The extension is written in TypeScript; it contains four fundamental files:
- `package.json`: Declares the hook properties that specify how this extension is integrated with Visual Studio Code
- `extension.ts`: This file declares the `activate()` and `deactivate()` functions, which provide hooks for the extension life cycle management.
- `obfuscatedContentProvider.ts`: The `ObfuscatedContentProvider` class implements the `TextDocumentContentProvider` interface of VSCode to display read-only obfuscated content.
- `obfuscatedDocument.ts`: This file declares the `ObfuscatedDocument` class that carries out the obfuscation task.

## VS Code integration (`package.json`)

This part of `package.json` takes care of the VS Code integration:

    "engines": {
        "vscode": "^1.11.0"
    },
    "categories": [
        "Other"
    ],
    "activationEvents": [
        "onCommand:preemptiveObfuscator.obfuscate"
    ],
    "main": "./out/src/extension",
    "contributes": {
        "commands": [
            {
                "command": "preemptiveObfuscator.obfuscate",
                "title": "Obfuscate code"
            }   
        ],
        "menus": {
            "editor/context": [
                {
                    "command": "preemptiveObfuscator.obfuscate",
                    "when": "editorLangId == javascript",
                    "group": "navigation@1.51"
                }
            ]
        }
    }

- `engines`:
- `categories`: This extension is displayed in the **Other** category of the extensions marketplace.
- `activationEvents`: The extension gets activated when the command with the `preemptiveObfuscator.obfuscate` identifier is first time used.
- `main` : The plugin's bootstrap code is in the `./out/src/extension.js` file.
- `contributes`: This is the main section that declares how this extension is hooked into the IDE.
    - `commands`: The command is displayed in the IDE as **Obfuscate code**.
    - `menus`: The command appears in the editor's context menu whenever a JavaScript file is being edited. The command is placed into the "navigation" section of the context menu (`navigation@1.51`)

## Source Code

### `extension.ts`

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

### `obfuscatedContentProvider.ts`

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

### `obfuscatedDocument.ts`

    'use strict';

    import { TextDocument, Uri } from 'vscode';

    // This class represents the obfuscated text document
    export default class ObfuscatedDocument {
        private _obfuscated: string = null;

        // Intialize the document
        constructor(private _document: TextDocument) {
        }

        // Obtain the obfuscated document text
        get obfuscatedText() {
            if (!this._obfuscated) {
                var originalContent = this._document.getText();
                var path = this._document.fileName;
                path = path.replace('\\', '/')
                var filename = path.split("/").pop();
                this._obfuscated = `// This is the obfucated version of ${filename}

                ` + this._obfuscateCode(originalContent);
            }
            return this._obfuscated;
        }

        // This function carries out the code obfuscation
        private _obfuscateCode(text: string) : string {
            var JavaScriptObfuscator = require('javascript-obfuscator');
            const obfuscationResult = JavaScriptObfuscator.obfuscate(
                text,
                {
                    // --- Obfuscation options used
                    compact: false,
                    controlFlowFlattening: true,
                    disableConsoleOutput: false
                }
            );
            return obfuscationResult.getObfuscatedCode();
        }
    }

