import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export class AiderImageBuilder {
  constructor(
    private logMessage: (message: string) => void,
    private logError: (message: string, error?: any) => void
  ) {}

  async buildAiderImage(): Promise<void> {
    try {
      const dockerfilePath = path.join(process.cwd(), "aider.Dockerfile");

      // Check if the aider.Dockerfile exists
      if (!fs.existsSync(dockerfilePath)) {
        this.logMessage(
          `[Server_Docker] ⚠️ aider.Dockerfile not found at ${dockerfilePath}. Creating default.`,
        );

        const defaultAiderDockerfile = `FROM python:3.11-slim
WORKDIR /workspace
RUN pip install --no-cache-dir aider-chat
# Create a non-root user for security
RUN useradd -m -u 1000 aider && chown -R aider:aider /workspace
USER aider
# Default command keeps container running
CMD ["tail", "-f", "/dev/null"]`;

        fs.writeFileSync(dockerfilePath, defaultAiderDockerfile);
        this.logMessage(`[Server_Docker] Created default ${dockerfilePath}`);
      }

      // Build the aider image
      this.logMessage(`[Server_Docker] Building aider image...`);
      execSync(
        `docker build -t testeranto-aider:latest -f ${dockerfilePath} .`,
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );
      this.logMessage(`[Server_Docker] ✅ Aider image built successfully`);
    } catch (error: any) {
      this.logError(`[Server_Docker] ❌ Aider image build failed:`, error);
      this.logMessage(
        `[Server_Docker] Aider services may not work, but continuing with other builds`,
      );
    }
  }
}
