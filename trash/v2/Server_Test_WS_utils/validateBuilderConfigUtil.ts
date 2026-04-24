export async function validateBuilderConfigUtil(
  configKey: string,
  failedBuilderConfigs: Set<string>
): Promise<boolean> {
  if (failedBuilderConfigs.has(configKey)) {
    console.log(`[validateBuilderConfigUtil] Skipping because builder failed for config ${configKey}`);
    return false;
  }
  return true;
}
