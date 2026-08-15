import { errorHandler, getVisitor, getCredentials } from "../../utils/index.js";
import { Request, Response } from "express";

export const handleGetVisitor = async (req: Request, res: Response): Promise<Record<string, any> | void> => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;

    const visitor = await getVisitor(credentials);
    const { isAdmin } = visitor;

    visitor.updateDataObject(
      {},
      {
        analytics: [{ analyticName: "starts", profileId, urlSlug, uniqueKey: profileId }],
      },
    );
    if (!isAdmin) {
      visitor.updateDataObject(
        {},
        {
          analytics: [{ analyticName: "starts_admin", uniqueKey: profileId, urlSlug }],
        },
      );
    }
    return res.json({ visitor: { isAdmin }, success: true });
  } catch (error) {
    return errorHandler({ error, functionName: "handleGetVisitor", message: "Error getting visitor", req, res });
  }
};
