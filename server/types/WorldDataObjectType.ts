export type WorldDataObjectType = {
  messages?: {
    [profileId: string]: { title: string; message: string; date_scheduled: string; displayName: string };
  };
};
