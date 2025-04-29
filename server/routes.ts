import express from "express";
import {
  handleGetVisitor,
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

// Visitor
router.get("/visitor", handleGetVisitor);

//World
router.post("/world/fire-toast", handleFireToast); // new route to fire toast immediately

router.post("/world/handle-schedule-toast", handleSetDataObject); // new route to update world object and schedule toasts

router.post("/world/handle-delete-toast", handleDeleteToast); // new route to update world object by deleting a toast

router.get("/world/handle-get-toasts", handleFetchDataObject); // new route to fetch world data object

export default router;
