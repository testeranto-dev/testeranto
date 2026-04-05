import esbuild from 'esbuild';
import path, { join } from "path";
import { Server_Docker } from "./Server_Docker";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import fs from 'fs';
import { processCwd, processExit } from './Server_Docker/Server_Docker_Dependents';

export class Server extends Server_Docker {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    const entryPoint = join(
      process.cwd(),
      "testeranto",
      "reports",
      "index.tsx",
    );
    const outfile = join(process.cwd(), "testeranto", "reports", "index.js");

    // Get the path to the stakeholder app source
    const stakeholderAppSource = join(__dirname, "../../stakeholderApp/index.tsx");

    // First, check if the entry point exists
    if (!fs.existsSync(entryPoint)) {
      console.log(`[Server] Entry point not found at ${entryPoint}, using default stakeholder app`);
      // Copy the default stakeholder app to the reports directory
      const defaultStakeholderApp = fs.readFileSync(stakeholderAppSource, 'utf-8');
      // Ensure the directory exists
      const reportsDir = join(process.cwd(), "testeranto", "reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      fs.writeFileSync(entryPoint, defaultStakeholderApp, 'utf-8');
    }

    // Get the project root to resolve node_modules
    const projectRoot = process.cwd();
    const nodeModulesPath = join(projectRoot, 'node_modules');

    // // Check if React is available in node_modules for aliasing
    // let reactAlias: Record<string, string> = {};
    // let reactDomAlias: Record<string, string> = {};

    // try {
    //   const reactPath = require.resolve('react');
    //   const reactDomPath = require.resolve('react-dom');
    //   reactAlias = { 'react': reactPath };
    //   reactDomAlias = { 'react-dom': reactDomPath };
    //   console.log(`[Server] React found at: ${reactPath}`);
    //   console.log(`[Server] ReactDOM found at: ${reactDomPath}`);
    // } catch (error) {
    //   console.error(`[Server] React not found in node_modules: ${error.message}`);
    //   throw new Error(`React is required but not found in node_modules. Please install react and react-dom.`);
    // }

    console.log(processCwd(), require.resolve('react'))
    // processExit(-1)

    const buildOptions: esbuild.BuildOptions = {
      entryPoints: [entryPoint],
      metafile: false,
      bundle: true,
      format: "iife", // Use IIFE format for browser compatibility
      platform: "browser",
      target: "es2020",
      jsx: "automatic",
      outfile: outfile,
      globalName: "TesterantoStakeholderApp", // Global variable name
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      // Add aliases to ensure React is only bundled once
      // Use path.dirname to get the directory containing the module, not the entry file
      alias: {
        'react': path.dirname(require.resolve('react')),
        'react-dom': path.dirname(require.resolve('react-dom')),
      },
      nodePaths: [nodeModulesPath],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js'
      }
    };

    try {
      console.log(`[Server] Bundling stakeholder app from ${entryPoint} to ${outfile}`);
      const result = esbuild.buildSync(buildOptions);
      console.log(`[Server] Successfully bundled stakeholder app`);

      // Verify the bundle was created
      if (fs.existsSync(outfile)) {
        const stats = fs.statSync(outfile);
        console.log(`[Server] Bundle created: ${outfile} (${stats.size} bytes)`);
      } else {
        console.error(`[Server] Bundle not created at ${outfile}`);
        throw new Error(`Bundle not created at ${outfile}`);
      }
    } catch (error) {
      console.error(`[Server] Error bundling stakeholder app:`, error);
      throw error;
    }

    // Copy the HTML file to the reports directory
    const htmlSource = join(__dirname, "../../stakeholderApp/index.html");
    const htmlDest = join(process.cwd(), "testeranto", "reports", "index.html");

    if (fs.existsSync(htmlSource)) {
      const htmlDir = path.dirname(htmlDest);
      if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, { recursive: true });
      }
      fs.copyFileSync(htmlSource, htmlDest);
      console.log(`[Server] Copied HTML file to ${htmlDest}`);
    } else {
      console.error(`[Server] HTML source file not found at ${htmlSource}`);
      throw new Error(`HTML source file not found at ${htmlSource}`);
    }

    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }

}
