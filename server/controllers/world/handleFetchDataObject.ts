import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../../utils/index.js";

// Function used to fetch the world data object
export const handleFetchDataObject = async (req: Request, res: Response) => {
    try {
        const credentials = getCredentials(req.query);
        const world = World.create(credentials.urlSlug, { credentials });

        // recieving the world data object
        const savedData = await world.fetchDataObject();

        // returning the data object
        return res.json({ savedData, success: true });
    } catch (error) {
        return errorHandler({
            error,
            functionName: "fetchDataObject",
            message: "Error fetching data object",
            req,
            res,
        });
    }
};
