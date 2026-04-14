import * as vscode from "vscode";
import { TestTreeDataProvider } from "../providers/TestTreeDataProvider";
import { DockerProcessTreeDataProvider } from "../providers/DockerProcessTreeDataProvider";
import { AiderProcessTreeDataProvider } from "../providers/AiderProcessTreeDataProvider";
import { FileTreeDataProvider } from "../providers/FileTreeDataProvider";
import { ViewTreeDataProvider } from "../providers/ViewTreeDataProvider";
import { AgentTreeDataProvider } from "../providers/AgentTreeDataProvider";

export function createProviders(outputChannel: vscode.OutputChannel): {
    runtimeProvider: TestTreeDataProvider;
    dockerProcessProvider: DockerProcessTreeDataProvider;
    aiderProcessProvider: AiderProcessTreeDataProvider;
    fileTreeProvider: FileTreeDataProvider;
    viewTreeProvider: ViewTreeDataProvider;
    agentProvider: AgentTreeDataProvider;
} {
    outputChannel.appendLine("[Testeranto] Creating TestTreeDataProvider...");
    const runtimeProvider = new TestTreeDataProvider();
    outputChannel.appendLine("[Testeranto] TestTreeDataProvider created successfully - uses /~/runtime API endpoint");

    outputChannel.appendLine("[Testeranto] Creating DockerProcessTreeDataProvider...");
    const dockerProcessProvider = new DockerProcessTreeDataProvider();
    outputChannel.appendLine("[Testeranto] DockerProcessTreeDataProvider created successfully - uses /~/process API endpoint");

    outputChannel.appendLine("[Testeranto] Creating AiderProcessTreeDataProvider...");
    const aiderProcessProvider = new AiderProcessTreeDataProvider();
    outputChannel.appendLine("[Testeranto] AiderProcessTreeDataProvider created successfully - uses /~/aider API endpoint");

    outputChannel.appendLine("[Testeranto] Creating FileTreeDataProvider...");
    const fileTreeProvider = new FileTreeDataProvider();
    outputChannel.appendLine("[Testeranto] FileTreeDataProvider created successfully - uses /~/files API endpoint");

    outputChannel.appendLine("[Testeranto] Creating ViewTreeDataProvider...");
    const viewTreeProvider = new ViewTreeDataProvider();
    outputChannel.appendLine("[Testeranto] ViewTreeDataProvider created successfully - uses /~/views API endpoint");

    outputChannel.appendLine("[Testeranto] Creating AgentTreeDataProvider...");
    const agentProvider = new AgentTreeDataProvider();
    outputChannel.appendLine("[Testeranto] AgentTreeDataProvider created successfully - uses /~/agents API endpoint");

    verifyProviders({
        runtimeProvider,
        dockerProcessProvider,
        aiderProcessProvider,
        fileTreeProvider,
        viewTreeProvider,
        agentProvider,
    }, outputChannel);

    return {
        runtimeProvider,
        dockerProcessProvider,
        aiderProcessProvider,
        fileTreeProvider,
        viewTreeProvider,
        agentProvider,
    };
}

function verifyProviders(providers: Record<string, any>, outputChannel: vscode.OutputChannel): void {
    outputChannel.appendLine("[Testeranto] Verifying providers implement required methods...");
    const requiredMethods = ['getChildren', 'getTreeItem'];
    for (const [name, provider] of Object.entries(providers)) {
        outputChannel.appendLine(`[Testeranto] Checking provider: ${name}`);
        for (const method of requiredMethods) {
            if (typeof (provider as any)[method] !== 'function') {
                const errorMsg = `${name} does not implement required method: ${method}`;
                outputChannel.appendLine(`[Testeranto] ERROR: ${errorMsg}`);
                throw new Error(errorMsg);
            }
            outputChannel.appendLine(`[Testeranto] ✓ ${name} implements ${method}`);
        }
    }
}
