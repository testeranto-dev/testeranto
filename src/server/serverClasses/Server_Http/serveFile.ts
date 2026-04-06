import fs from "fs";
import { getContentType } from "./getContentType";

export const serveFile = async (filePath: string): Promise<Response> => {
  try {
    const contentType = getContentType(filePath);
    const fileContent = await fs.promises.readFile(filePath);
    console.log(`[serveFile] Serving ${filePath} (${fileContent.length} bytes)`);
    return new Response(fileContent, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (error: any) {
    console.error(`[serveFile] Error serving ${filePath}:`, error);
    if (error.code === 'ENOENT') {
      return new Response(`File not found: ${filePath}`, {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response(`Error reading file: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};