FROM python:3.11-slim
# FROM paulgauthier/aider-full
WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*
    
RUN pip install --no-cache-dir aider-chat
# Create a non-root user for security
RUN useradd -m -u 1000 aider && chown -R aider:aider /workspace
# Don't create agent.md file - it will be copied from mounted agents directory
USER aider
# Copy API keys if they exist in the host's .aider.conf.yml
# The actual API keys will be passed as environment variables at runtime
# Default command keeps container running
CMD ["tail", "-f", "/dev/null"]
