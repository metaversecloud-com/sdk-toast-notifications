// Known bugs pinned by test.fail. Remove the marker together with the fix.
const ISSUE = "EXP-462";

export const BUG = {
  nonAdminCanFireToast: `${ISSUE}: POST /world/fire-toast has no admin check; any player can toast the whole world`,
  noServerValidation: `${ISSUE}: fire-toast doesn't validate title/text server-side (empty or over 40/140 chars)`,
  fireToastErrorSwallowed: `${ISSUE}: a failed World.fireToast is swallowed and the route answers success`,
  unawaitedAnalyticsCrash: `${ISSUE}: un-awaited analytics writes reject and @rtsdk/topia exits the process`,
  startsAdminInverted: `${ISSUE}: starts_admin is recorded when the visitor is NOT an admin`,
  visitorFetchedTwice: `${ISSUE}: Home re-runs the /visitor effect when isAdmin flips, loading it twice`,
  nonAdminReadsMessages: `${ISSUE}: GET /world/handle-get-toasts has no admin check`,
  scheduledPageNoCredentials: `${ISSUE}: /scheduled-messages fetches before backendAPI has the credentials`,
  getCredentialsDoesntThrow: "EXP-428 #6: getCredentials doesn't throw",
};
