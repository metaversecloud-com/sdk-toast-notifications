import { Request, Response } from "express";
import cron from "node-cron";
import { World, errorHandler, getCredentials } from "../../utils/index.js";
import crypto from "crypto";
import { DateTime } from "luxon";

const scheduledJobs: Record<string, any> = {};

/**
 * This controller is used to set the world data object and add each scheduled toast to the cron
 * All times will be recorded in the data object in PST
 * Accepts {title, message, date_scheduled}
 */

export const handleSetDataObject = async (req: Request, res: Response) => {
  try {
    throw "This functionality is not yet available";

    // Values stored in data object
    const credentials = getCredentials(req.query);
    const { profileId, displayName } = credentials;
    const { title, message, date_scheduled } = req.body;
    const formattedDate = DateTime.now().setZone("America/Los_Angeles").toFormat("yyyy-MM-dd'T'HH:mm");
    const world = World.create(credentials.urlSlug, { credentials });

    // Parsing the schedule date so it can be added to cron.
    const scheduleDate = DateTime.fromISO(date_scheduled, { zone: "America/Los_Angeles" });
    const formattedScheduledDate = scheduleDate.toFormat("yyyy-MM-dd'T'HH:mm");
    const min = scheduleDate.minute;
    const hour = scheduleDate.hour;
    const day = scheduleDate.day;
    const month = scheduleDate.month;
    const cronTime = `${min} ${hour} ${day} ${month} *`;

    // generating a unique job id for admins that want to schedule multple messages at the same time
    let jobId = crypto.randomUUID();
    while (scheduledJobs[jobId]) {
      jobId = crypto.randomUUID(); // assign a new id if the jobId already exists
    }

    // scheduling messages to be sent - adding to cron
    scheduledJobs[jobId] = cron.schedule(
      cronTime,
      async () => {
        // fetching a copy of the world data object
        const response = (await world.fetchDataObject()) as any;

        // Check if the job exists in the world object, if it was deleted by user then it could not exist
        if (!response?.messages?.[profileId]?.[jobId]) {
          delete scheduledJobs[jobId]; // Remove from scheduled jobs and exit
          return;
        }

        // firing toast at scheduled time
        await world
          .fireToast({
            title,
            text: message,
          })
          .catch((error) =>
            errorHandler({
              error,
              functionName: "handleSetDataObject",
              message: "Error firing toast",
            }),
          );

        // Remove the message from the world data object after the cron job executes
        delete response.messages[profileId][jobId];

        // If no more messages exist for the profile, the profileid is removed from the data object
        if (Object.keys(response.messages[profileId]).length === 0) {
          delete response.messages[profileId];
        }

        // Update the data object with the modified messages
        await world.updateDataObject({ messages: response.messages });

        // Remove from scheduled jobs after execution
        delete scheduledJobs[jobId];
      },
      {
        scheduled: true,
        name: jobId,
        timezone: "America/Los_Angeles",
      },
    );

    // adding the toast to the world data object
    await world.updateDataObject({
      [`messages.${profileId}.${jobId}`]: {
        // key is profile id + jobid
        title,
        message,
        date_scheduled: formattedScheduledDate,
        date_created: formattedDate,
        job_id: jobId,
        displayName,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "setDataObject",
      message: "Error setting data object",
      req,
      res,
    });
  }
};
