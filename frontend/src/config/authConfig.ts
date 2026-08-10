import { SocialProvider } from '../types/auth';

/**
 * Global configuration for OAuth 2.0 social authentication providers.
 * To enable Microsoft or Apple login when backend support is added,
 * update the respective provider flag to `true`.
 */
export const ENABLED_OAUTH_PROVIDERS: Record<SocialProvider, boolean> = {
  Google: true,
  Microsoft: false, // Set to true when backend support is added
  Apple: false,     // Set to true when backend support is added
};
