export interface EnsureImageExistsParams {
  imageName: string;
  runtime: string;
  configKey: string;
  dockerfilePath?: string;
  buildContext: string;
  cacheMounts?: string[];
  targetStage?: string;
  buildArgs?: Record<string, string>;
}

export interface EnsureImageExistsResult {
  imageName: string;
  alreadyExists: boolean;
  buildRequired: boolean;
}

export function ensureImageExists(params: EnsureImageExistsParams): EnsureImageExistsResult {
  return {
    imageName: params.imageName,
    alreadyExists: false,
    buildRequired: true,
  };
}
