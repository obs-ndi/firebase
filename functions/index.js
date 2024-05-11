const firestore = require("firebase-admin/firestore");
const functions = require("firebase-functions");
const logger = require("firebase-functions/logger");

const axios = require("axios");
const cors = require("cors");
const express = require("express");
const app = express();

const {initializeApp} = require("firebase-admin/app");
initializeApp();

app.use(cors({origin: true}));

/**
 * To test:
 * https://obsndiproject.com/update?obsGuid=xyz&obsndiVersion=1.2.3
 * https://obs-ndi.web.app/update?obsGuid=xyz&obsndiVersion=1.2.3
 * http://127.0.0.1:5002/update?obsGuid=xyz&obsndiVersion=1.2.3
 */
app.get("/update", async (req, res) => {
  try {
    const obsGuid = req.query.obsGuid;
    const obsndiVersion = req.query.obsndiVersion;
    if (!obsGuid || !obsndiVersion) {
      res.sendStatus(403);
      return;
    }

    const updateInfo = {obsGuid, obsndiVersion, timestamp: new Date()};
    logger.info("updateInfo", updateInfo);

    const db = firestore.getFirestore();
    const doc = db.doc(`updates/${obsGuid}`);
    await doc.set(updateInfo);

    const response = await axios.get("https://api.github.com/repos/obs-ndi/obs-ndi/releases/latest");
    const responseData = response.data;
    // logger.info("responseData", responseData);
    // parse responseData json for
    // {
    //   "html_url": "https://github.com/obs-ndi/obs-ndi/releases/tag/4.13.2",
    //   "tag_name": "4.13.2",
    //   "name": "OBS-NDI 4.13.2",
    //   "created_at": "2024-04-28T17:18:27Z",
    //   "published_at": "2024-05-02T20:36:30Z",
    // }
    const data = {
      tag_name: responseData.tag_name,
      name: responseData.name,
      html_url: responseData.html_url,
      created_at: responseData.created_at,
      published_at: responseData.published_at,
    };
    logger.info("data", data);
    res.json(data);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

exports.updateHandler = functions.https.onRequest(app);
