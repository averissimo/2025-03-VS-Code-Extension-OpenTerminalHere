const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Register the command to open terminal at the selected location
    let disposable = vscode.commands.registerCommand('open-terminal-here.openTerminalHere', async (uri) => {
        try {
            // If no URI is provided (command called from command palette), use the active file
            if (!uri) {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    uri = activeEditor.document.uri;
                    // Get the directory of the file
                    const fileDir = vscode.Uri.file(uri.fsPath.substring(0, uri.fsPath.lastIndexOf('\\')));
                    uri = fileDir;
                } else {
                    // No active editor, show error message
                    vscode.window.showErrorMessage('No file is currently open');
                    return;
                }
            }
            
            // If URI is a file, get its directory
            let fsPath = uri.fsPath;
            const stats = await vscode.workspace.fs.stat(uri);
            if (stats.type === vscode.FileType.File) {
                fsPath = fsPath.substring(0, fsPath.lastIndexOf('\\'));
            }
            
            // Create a new terminal with the selected directory as CWD
            const terminal = vscode.window.createTerminal({
                name: `Radian (${fsPath.split('\\').pop()})`,
                shellPath: "/home/averissimo/.local/bin/radian",
                cwd: fsPath
            });
            
            terminal.show();
            terminal.sendText('radian');
            vscode.window.showInformationMessage(`Radian opened at: ${fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open terminal: ${error.message}`);
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
