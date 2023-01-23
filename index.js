import { Expo } from "expo-server-sdk";
import express from "express";
import config from "config";
import bodyParser from "body-parser";
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
const expoPushTokens = router.post("/", async (req, res) => {
  const { token, message } = req.body;
  await sendPushNotification(token, message);
  res.status(201).send({
    message: "Notification Send",
  });
});

const sendPushNotification = async (targetExpoPushToken, message) => {
  const expo = new Expo();
  const chunks = expo.chunkPushNotifications([
    { to: targetExpoPushToken, sound: "default", body: message },
  ]);

  const sendChunks = async () => {
    // This code runs synchronously. We're waiting for each chunk to be send.
    // A better approach is to use Promise.all() and send multiple chunks in parallel.
    chunks.forEach(async (chunk) => {
      console.log("Sending Chunk", chunk);
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log("Tickets", tickets);
      } catch (error) {
        console.log("Error sending chunk", error);
      }
    });
  };

  await sendChunks();
};

app.use("/api/sendNotification", expoPushTokens);
const PORT = process.env.PORT || 3030;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}...`);
});
