const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(bodyParser.json());

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, "custom_auth_path"), // Specify a custom path if needed
  }),
  puppeteer: {
    headless: true,
    timeout: 60000,
  },
});

// Generate QR code for authentication
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("Scan the QR code above to authenticate.");
});

// Client is ready
client.on("ready", async () => {
  console.log("WhatsApp client is ready!");
  const number = "918124640336@c.us";
  const message = "Hello from my GRIT BOT!";
  await client.sendMessage(number, message);
});

// Handle incoming messages
client.on("message", async (message) => {
  try {
    // Check for messages from specific groups
    if (
      message.from === "120363329610073428@g.us" &&
      message.body.toLowerCase().includes("name")
    ) {
      const data = parseMessage(message.body);

      if (message.hasMedia) {
        const media = await message.downloadMedia();
        if (media) {
          const fileName = `image_${data.name.replace(/ /g, "")}.jpg`;
          const imagePath = path.join(
            __dirname,
            "..",
            "public",
            "assets",
            "memberImages",
            fileName
          );

          // Create directory if it doesn't exist
          fs.mkdirSync(path.dirname(imagePath), { recursive: true });

          // Save the image to a file
          fs.writeFileSync(imagePath, media.data, { encoding: "base64" });
          console.log(`Image saved to ${imagePath}`);
          data.url = imagePath;
        } else {
          console.error("Media download failed.");
        }
      } else {
        console.log("Received a non-media message:", message.body);
      }

      await sendToServer(data, "memberdetail");
    }

    if (
      message.from === "120363346571790033@g.us" &&
      message.body.toLowerCase().includes("name")
    ) {
      const data = parseMessage(message.body);
      await sendToServer(data, "memberpayment");
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

// Function to parse message body
function parseMessage(messageBody) {
  const data = {};
  const lines = messageBody.split("\n");

  lines.forEach((line) => {
    const [key, value] = line.split(": ").map((item) => item.trim());
    if (key && value) {
      switch (key) {
        case "Name":
          data.name = value;
          break;
        case "DOB":
          data.dateofbirth = value;
          break;
        case "Email":
          data.email = value;
          break;
        case "Ph no":
          data.phone = value;
          break;
        case "Emergency no":
          data.emergencyNumber = value;
          break;
        case "Height":
          data.height = parseFloat(value);
          break;
        case "Weight":
          data.weight = parseFloat(value);
          break;
        case "Medical condition":
          data.medicalCondition = value;
          break;
        default:
          break;
      }
    }
  });
  // Add additional fields
  const today = new Date();

  const year = today.getFullYear(); // Current year (e.g., 2024)
  const month = today.getMonth(); // Current month (0-11, where 0 is January)
  const day = today.getDate();
  Object.assign(data, {
    joiningDate: Date(new Date(year, month, day)),
    membership: "NA",
    membershipAmount: 0,
    member_id: null,
    membershipstart: null,
    membershipend: null,
    invoicenumber: null,
    invoicedate: null,
    lastpaymentdate: null,
    lastpaymentmode: null,
    totalPaid: 0,
    plan: null,
    diet: null,
    trainer: null,
    paymentpending: null,
    pendingamount: 0,
    status: "Trial",
  });

  return data;
}

// Function to send data to server
async function sendToServer(data, flag) {
  try {
    const url =
      flag === "memberdetail"
        ? "http://localhost:5000/api/memberdetail"
        : "http://localhost:5000/api/memberpayment";
    const response = await axios.post(url, data);
    console.log("Server response:", response.data);
  } catch (error) {
    console.error("Error sending data to server:", error);
  }
}

module.exports = client; // Export the client instance
