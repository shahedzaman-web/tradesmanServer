import { Expo } from "expo-server-sdk";
import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
const stripe = Stripe(
  "sk_test_51MOfw2KFkj7Hq1GhFknfWV21CFUnawe1jzA5YWNQfmuggIQo2af5yPloaxvuw673YO0Jo9ct2gqPEHst5dApbtA700e4Ra64kL"
);
import cors from "cors";
const router = express.Router();
const app = express();
app.use(cors());
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

app.post("/donate", async (req, res) => {
  try {
    // Getting data from client
    let { amount, name } = req.body;
    // Simple validation
    if (!amount || !name)
      return res.status(400).json({ message: "All fields are required" });
    amount = parseInt(amount);
    // Initiate payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "CAD",
      payment_method_types: ["card"],
      metadata: { name },
    });
    // Extracting the client secret
    const clientSecret = paymentIntent.client_secret;
    // Sending the client secret as response
    res.json({ message: "Payment initiated", clientSecret });
  } catch (err) {
    // Catch any error and send error 500 to client
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.use("/stripe", express.raw({ type: "*/*" }));
app.post("/stripe", async (req, res) => {
  // Get the signature from the headers
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    // Check if the event is sent from Stripe or a third party
    // And parse the event
    event = await stripe.webhooks.constructEvent(
      req.body,
      sig,
      "we_1MP4lmKFkj7Hq1Ghhi1Ijfxb"
    );
  } catch (err) {
    // Handle what happens if the event is not from Stripe
    console.log(err);
    return res.status(400).json({ message: err.message });
  }
  // Event when a payment is initiated
  if (event.type === "payment_intent.created") {
    console.log(`${event.data.object.metadata.name} initated payment!`);
  }
  // Event when a payment is succeeded
  if (event.type === "payment_intent.succeeded") {
    console.log(`${event.data.object.metadata.name} succeeded payment!`);
    // fulfilment
  }
  res.json({ ok: true });
});
const sendPushNotification = async (targetExpoPushToken, message) => {
  const expo = new Expo();
  const chunks = expo.chunkPushNotifications([
    { to: targetExpoPushToken, sound: "default", body: message },
  ]);

  const sendChunks = async () => {
    chunks.forEach(async (chunk) => {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.log("Error sending chunk", error);
      }
    });
  };

  await sendChunks();
};

app.use("/api/sendNotification", expoPushTokens);

app.post("/donate", async (req, res) => {
  try {
    // Getting data from client
    let { amount, name } = req.body;
    // Simple validation
    if (!amount || !name)
      return res.status(400).json({ message: "All fields are required" });
    amount = parseInt(amount);
    // Initiate payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      payment_method_types: ["card"],
      metadata: { name },
    });
    // Extracting the client secret
    const clientSecret = paymentIntent.client_secret;
    // Sending the client secret as response
    res.json({ message: "Payment initiated", clientSecret });
  } catch (err) {
    // Catch any error and send error 500 to client
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}...`);
});
