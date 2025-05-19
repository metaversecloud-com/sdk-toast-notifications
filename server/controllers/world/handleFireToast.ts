import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../../utils/index.js";

// Function used to fire a toast, modeled after handleGetWorldDetails

export const handleFireToast = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const world = World.create(credentials.urlSlug, { credentials });

    // allows custom message/titles
    await world
      .fireToast({
        title: req.body.title,
        text: req.body.text,
      })
      .catch((error) =>
        errorHandler({
          error,
          functionName: "handleFireToast",
          message: "Error firing toast",
        }),
      );

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
