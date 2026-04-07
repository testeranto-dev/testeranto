import { execGit } from './shell';

export async function handleGitStatus(): Promise<Response> {
  const branch = execGit('git rev-parse --abbrev-ref HEAD');
  const status = execGit('git status --porcelain');
  const statusLines = status ? status.split('\n') : [];
  const hasUncommittedChanges = statusLines.length > 0;
  
  return new Response(JSON.stringify({
    branch,
    hasUncommittedChanges,
    statusLines,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGitSwitchBranch(request: Request): Promise<Response> {
  const body = await request.json();
  const { branch, force } = body;
  
  if (!branch || typeof branch !== 'string') {
    throw new Error("Branch name is required and must be a string");
  }
  
  execGit(`git show-ref --verify --quiet refs/heads/${branch}`);
  
  if (!force) {
    const status = execGit('git status --porcelain');
    if (status) {
      throw new Error("There are uncommitted changes. Use force=true to discard them or commit first.");
    }
  }
  
  execGit(`git checkout ${branch}`);
  
  return new Response(JSON.stringify({
    success: true,
    branch,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGitCommit(request: Request): Promise<Response> {
  const body = await request.json();
  const { message, files } = body;
  
  if (!message || typeof message !== 'string') {
    throw new Error("Commit message is required and must be a string");
  }
  
  if (files && Array.isArray(files)) {
    for (const file of files) {
      execGit(`git add "${file}"`);
    }
  } else {
    execGit('git add -A');
  }
  
  execGit(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGitMerge(request: Request): Promise<Response> {
  const body = await request.json();
  const { branch } = body;
  
  if (!branch || typeof branch !== 'string') {
    throw new Error("Branch name is required and must be a string");
  }
  
  execGit(`git show-ref --verify --quiet refs/heads/${branch}`);
  execGit(`git merge ${branch}`);
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGitConflicts(): Promise<Response> {
  const unmerged = execGit('git diff --name-only --diff-filter=U');
  const conflictFiles = unmerged ? unmerged.split('\n') : [];
  
  return new Response(JSON.stringify({
    hasConflicts: conflictFiles.length > 0,
    conflictFiles,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGitResolveConflict(request: Request): Promise<Response> {
  const body = await request.json();
  const { file } = body;
  
  if (!file || typeof file !== 'string') {
    throw new Error("File path is required and must be a string");
  }
  
  execGit(`git add "${file}"`);
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
