import express from "express";
import {
  handleDropAsset,
  handleGetDroppedAsset,
  handleGetVisitor,
  handleRemoveDroppedAssetsByUniqueName,
  handleGetWorldDetails,
  handleUpdateWorldDataObject,
  handleFireToast,
  handleSetDataObject,
  handleFetchDataObject,
  handleDeleteToast,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();
const SERVER_START_DATE = new Date();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    serverStartDate: SERVER_START_DATE,
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      S3_BUCKET: process.env.S3_BUCKET,
    },
  });
});

// Dropped Assets
router.post("/dropped-asset", handleDropAsset);
router.get("/dropped-asset", handleGetDroppedAsset);
router.post("/remove-dropped-assets", handleRemoveDroppedAssetsByUniqueName);

// Visitor
router.get("/visitor", handleGetVisitor);


// World
router.get("/world", handleGetWorldDetails);
router.put("/world/data-object", handleUpdateWorldDataObject);


// new route to fire toast immediately
router.post("/world/fire-toast", handleFireToast);

// new route to update world object and schedule toasts
router.post("/world/handle-schedule-toast", handleSetDataObject); 

// new route to update world object by deleting a toast
router.post("/world/handle-delete-toast", handleDeleteToast);

// new route to fetch world data object
router.get("/world/handle-get-toasts", handleFetchDataObject) 


export default router;
