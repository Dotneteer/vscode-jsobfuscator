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
