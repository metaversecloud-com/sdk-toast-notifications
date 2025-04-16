import { Request, Response } from "express";
import cron from "node-cron"; 
import { World, errorHandler, getCredentials } from "../../utils/index.js";
import crypto from "crypto"; // Import for UUID generation
import { DateTime } from 'luxon';

const scheduledJobs: Record<string, any> = {};
  
// Function used to set the world data object

export const handleSetDataObject = async (req: Request, res: Response) => {
    try {
        const credentials = getCredentials(req.query);
        const { profileId } = credentials;
        const { title, message, date_scheduled } = req.body;
        // This currently gives the date in UTC time
        //const currentDate = new Date();
        // changing to est time
        //const formattedDate = currentDate.toLocaleString("sv-SE", { hour12: false }).replace(" ", "T").slice(0, 16);
        const formattedDate = DateTime.now().setZone('America/Los_Angeles').toFormat("yyyy-MM-dd'T'HH:mm");

        const world = World.create(credentials.urlSlug, { credentials });


        // error check
        if (!date_scheduled) {
            return res.status(400).json({ error: "Scheduled time is required." });
        }

        // parsing schedule date so I can add it to cron (uses local time)
        //const scheduleDate = new Date(date_scheduled);
        const scheduleDate = DateTime.fromISO(date_scheduled, { zone: 'America/Los_Angeles' });
        const formattedScheduledDate = scheduleDate.toFormat("yyyy-MM-dd'T'HH:mm");
        const min = scheduleDate.minute;
        const hour = scheduleDate.hour;
        const day = scheduleDate.day;
        const month = scheduleDate.month;
        const cronTime = `${min} ${hour} ${day} ${month} *`;
        console.log(cronTime);
        console.log(formattedScheduledDate);
        console.log(formattedDate);

        let jobId = crypto.randomUUID(); // used to generate unique id
        while (scheduledJobs[jobId]) {
            jobId = crypto.randomUUID(); // assign a new id if the jobId already exists
        }

        // scheduling messages to be sent - adding to cron
        scheduledJobs[jobId] = cron.schedule(cronTime, async () => {
            const response = await world.fetchDataObject() as any;

            // Check if the job exists in the world object  - if it was deleted by user then it could not exist
            if (!response?.messages?.[profileId]?.[jobId]) {
                console.log(`Scheduled job ${jobId} was removed before execution.`);
                delete scheduledJobs[jobId]; // Remove from scheduled jobs
                return; // Exit early without firing the toast
            }

            console.log("Sent");
            await world.fireToast({
                title,
                text: message, 
            });

            // Remove the message from the world data object after the cron job executes
            delete response.messages[profileId][jobId];

            // If no more messages exist for the profile, remove the profile entry
            if (Object.keys(response.messages[profileId]).length === 0) {
                delete response.messages[profileId];
            }

            // Update the data object with the modified messages
            await world.updateDataObject({ messages: response.messages });

            // Remove from scheduled jobs after execution
            delete scheduledJobs[jobId];
        }, {
            scheduled: true,
            name: jobId,
            timezone: 'America/Los_Angeles',
        });

        // adding toast to the world data object
        await world.updateDataObject(
            {
            [`messages.${profileId}.${jobId}`]: {   // key is profile id + jobid
                title,
                message,
                date_scheduled: formattedScheduledDate,
                date_created: formattedDate,        // dates are in different time zones, need to fix
                job_id: jobId,
            }, 
            },
        );


        return res.json({success: true });
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
