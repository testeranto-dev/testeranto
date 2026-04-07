import * as vscode from "vscode";

export const registerConfigCommands = (): vscode.Disposable[] => {
    const disposables: vscode.Disposable[] = [];

    disposables.push(
        vscode.commands.registerCommand(
            "testeranto.openConfig",
            async () => {
                try {
                    const uri = vscode.Uri.file("allTests.ts");
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                } catch (err) {
                    vscode.window.showWarningMessage("Could not open allTests.ts configuration file");
                }
            }
        )
    );

    disposables.push(
        vscode.commands.registerCommand(
            "testeranto.openTesterantoConfig",
            async () => {
                try {
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders && workspaceFolders.length > 0) {
                        const workspaceRoot = workspaceFolders[0].uri;

                        // Try to find the testeranto/testeranto.ts file
                        const configUri = vscode.Uri.joinPath(workspaceRoot, "testeranto", "testeranto.ts");

                        try {
                            const doc = await vscode.workspace.openTextDocument(configUri);
                            await vscode.window.showTextDocument(doc);
                        } catch (err) {
                            // If not found, try alternative locations
                            const alternativePaths = [
                                vscode.Uri.joinPath(workspaceRoot, "testeranto.ts"),
                                vscode.Uri.file("testeranto/testeranto.ts"),
                                vscode.Uri.file("testeranto.ts")
                            ];

                            let opened = false;
                            for (const uri of alternativePaths) {
                                try {
                                    const doc = await vscode.workspace.openTextDocument(uri);
                                    await vscode.window.showTextDocument(doc);
                                    opened = true;
                                    break;
                                } catch (e) {
                                    // Continue to next path
                                }
                            }

                            if (!opened) {
                                // Search for the file in the workspace
                                const files = await vscode.workspace.findFiles("**/testeranto.ts", "**/node_modules/**", 1);
                                if (files.length > 0) {
                                    const doc = await vscode.workspace.openTextDocument(files[0]);
                                    await vscode.window.showTextDocument(doc);
                                } else {
                                    vscode.window.showWarningMessage("Could not find testeranto/testeranto.ts configuration file");
                                }
                            }
                        }
                    } else {
                        vscode.window.showWarningMessage("No workspace folder open");
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Error opening testeranto config: ${err}`);
                }
            }
        )
    );

    return disposables;
};
