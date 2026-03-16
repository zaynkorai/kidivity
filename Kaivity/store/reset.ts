/**
 * Resets all user-related stores to their initial states.
 * Deferring imports to break circular dependencies.
 */
export function resetAllStores() {
  // Use dynamic require/import logic here if needed, 
  // but since this is called at runtime, we can just use the stores.
  // To be absolutely sure and avoid top-level cycles:
  
  const { useProfileStore } = require('./profileStore');
  const { useOnboardingSessionStore } = require('./onboardingSession.store');
  const { useActivityStore } = require('./activityStore');

  useProfileStore.getState().clearProfiles();
  useOnboardingSessionStore.getState().reset();
  useActivityStore.getState().reset();
}
