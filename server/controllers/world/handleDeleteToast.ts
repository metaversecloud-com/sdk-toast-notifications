import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../../utils/index.js";

export const handleDeleteToast = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId } = credentials; // Extract profileId
    const world = World.create(credentials.urlSlug, { credentials });

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required." });
    }

    // Fetch the current messages object
    const response = await world.fetchDataObject() as any;
    console.log("Fetched data object:", response); // Debugging

    if (!response?.messages?.[profileId] || !response.messages[profileId][jobId]) {
      return res.status(404).json({ error: "Scheduled message not found." });
    }

    // Remove the message
    delete response.messages[profileId][jobId];

    // If no more messages exist for the profile, remove the profile entry
    if (Object.keys(response.messages[profileId]).length === 0) {
      delete response.messages[profileId];
    }

    // Save updated data
    await world.updateDataObject({ messages: response.messages });
    console.log("Message deleted");

    return res.json({ success: true, message: "Scheduled message deleted successfully." });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleDeleteToast",
      message: "Error deleting scheduled message",
      req,
      res,
    });
  }
};
