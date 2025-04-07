import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../../utils/index.js";

// Function used to fire a toast, modeled after handleGetWorldDetails

export const handleFireToast = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const world = World.create(credentials.urlSlug, { credentials });

    // allows custom message/titles or has default values 
    await world.fireToast({
      groupId: "custom-message",
      title: req.body.title || "Hello World",
      text: req.body.text || "Thank you for participating!",
    });

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "fireToast",
      message: "Error triggering toast",
      req,
      res,
    });
  }
};
