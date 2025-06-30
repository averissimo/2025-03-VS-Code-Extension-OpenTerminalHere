const vscode = require('vscode');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Register the command to open terminal at the selected location
    let openTerminal = vscode.commands.registerCommand('open-rterminal-here.openRTerminalHere', async (uri) => {
        try {
            // If no URI is provided (command called from command palette), use the active file
            if (!uri) {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    uri = activeEditor.document.uri;
                    // Get the directory of the file
                    const fileDir = vscode.Uri.file(path.dirname(uri.fsPath));
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
                fsPath = path.dirname(fsPath);
            }
            
            const dirName = path.basename(fsPath);

            // Create a new terminal with the selected directory as CWD
            const terminal = vscode.window.createTerminal({
                name: `R ${dirName}`,
                    shellPath: "/usr/bin/R",
                shellArgs: ["--no-save", "--no-restore"],
                cwd: fsPath
            });
            
            terminal.show();
            vscode.window.showInformationMessage(`Radian opened at: ${fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open terminal: ${error.message}`);
            console.error(error);
        }
    });

    let sendDocument = vscode.commands.registerCommand('open-rterminal-here.insertDevtoolsDocumentToTerminal', async () => {
        const commandText = "devtools::document()";

        let terminal = vscode.window.activeTerminal;
        if (!terminal) {
        // If no terminal is active, create a new one
            openTerminal()
        }
        terminal.show();
        terminal.sendText(commandText);
    });

    let sendLoadAll = vscode.commands.registerCommand('open-rterminal-here.insertLoadAllTerminal', async () => {
        const editor = vscode.window.activeTextEditor;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!editor) {
            vscode.window.showErrorMessage("No active file.");
            return;
        }

        if (!workspaceFolder) {
            const fileDir = path.dirname(filePath);
            vscode.window.showErrorMessage("No workspace open. Using file's directory instead.");
            sendToTerminal(fileDir);
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const workspacePath = workspaceFolder.uri.fsPath;

        // Compute the path of active file relative to the workspace root
        const relativePath = path.relative(workspacePath, filePath);

        let packagePath;
        if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            // filePath is outside workspace — use the file's own folder
            packagePath = fileDir;
        } else {
            // file is inside workspace — get first-level folder
            const parts = relativePath.split(path.sep);

            if (parts.length === 0) {
                vscode.window.showErrorMessage("Couldn't determine folder after workspace root.");
                return;
            }

            const firstLevelFolder = parts[0];
            packagePath = path.join(workspacePath, firstLevelFolder);
        }

        // Build your command string
        sendToTerminal(packagePath)
    });
    context.subscriptions.push(openTerminal);
    context.subscriptions.push(sendLoadAll);
    context.subscriptions.push(sendDocument);
}

function sendToTerminal(packagePath) {
    const commandText = `pkgload::load_all("${packagePath.replace(/\\/g, "/")}")`;

    let terminal = vscode.window.activeTerminal;
    if (!terminal) {
        // If no terminal is active, create a new one
        openTerminal();
    }
    terminal.show();
    terminal.sendText(commandText);

    vscode.window.showInformationMessage(`Sent: ${commandText}`);
}


function deactivate() {}

module.exports = {
    activate,
    deactivate
};
