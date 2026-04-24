import path from "path";
import fs from "fs";
import type { ITesterantoConfig } from "../../../src/server/Types";
import { embedConfigInHtml } from "../Server_Docker/embedConfigInHtml";
import { serveFile } from "./serveFile";

const generateAndWriteStakeholderHtml = async (
  configs: ITesterantoConfig,
): Promise<void> => {
  await embedConfigInHtml(configs);
};

export const serveStaticFile = async (
  request: Request,
  url: URL,
  configs?: ITesterantoConfig,
): Promise<Response> => {
  const normalizedPath = decodeURIComponent(url.pathname);

  // if (normalizedPath.includes("..")) {
  //   throw new Error("Forbidden: Directory traversal not allowed");
  // }

  const projectRoot = process.cwd();

  // Stakeholder API routes are now handled in Server_HTTP.ts before reaching here
  // So we don't need to check for them here

  // Handle root and index.html
  if (normalizedPath === "/" || normalizedPath === "/index.html") {
    await generateAndWriteStakeholderHtml(configs);

    const reportPath = path.join(
      projectRoot,
      "testeranto",
      "reports",
      "index.html",
    );
    const htmlWithData = fs.readFileSync(reportPath, 'utf-8');
    return new Response(htmlWithData, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Handle reports index
  if (
    normalizedPath === "/testeranto/reports/index.html" ||
    normalizedPath === "/testeranto/reports/"
  ) {
    await generateAndWriteStakeholderHtml(configs);

    const reportPath = path.join(
      projectRoot,
      "testeranto",
      "reports",
      "index.html",
    );
    const htmlWithData = fs.readFileSync(reportPath, 'utf-8');
    return new Response(htmlWithData, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  const filePath = path.join(projectRoot, normalizedPath);
  return await serveFile(filePath);
};