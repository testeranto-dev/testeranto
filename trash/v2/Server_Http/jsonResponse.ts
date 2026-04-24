import {
  VscodeHttpAPI, StakeholderHttpAPI, VscodeHttpEndpoint, StakeholderHttpEndpoint
} from "../../../api";

export const jsonResponse = <
  T extends VscodeHttpEndpoint | StakeholderHttpEndpoint,
  API extends T extends VscodeHttpEndpoint ? VscodeHttpAPI : StakeholderHttpAPI
>(
  data: T extends VscodeHttpEndpoint
    ? VscodeHttpAPI[T]['response']
    : StakeholderHttpAPI[T]['response'],
  status = 200,
  apiDefinition?: API[T]
): Response => {
  // If API definition provided, validate response structure
  if (apiDefinition && apiDefinition.response) {
    // Basic validation - could be expanded
    const expectedKeys = Object.keys(apiDefinition.response);
    const actualKeys = Object.keys(data);

    // Check if all expected keys are present (excluding timestamp which we add)
    for (const key of expectedKeys) {
      if (key !== 'timestamp' && !actualKeys.includes(key)) {
        console.warn(`API response missing expected key: ${key} for endpoint`);
      }
    }
  }

  const responseData = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(responseData, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
