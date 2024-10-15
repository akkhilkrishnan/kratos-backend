const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const { ObjectId } = require("mongodb");
const whatsappClient = require("./whatsapp"); // Adjust the path if needed
// const updateUser = require("./updateQuery");
//connecting to MongoDB client
mongoose
  .connect("mongodb+srv://Akkhil:Akkhil09@cluster0.oeyly.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    fetchfullData().then(() => updateUser());
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors());
const { MongoClient } = require("mongodb");
const client = new MongoClient(
  "mongodb+srv://Akkhil:Akkhil09@cluster0.oeyly.mongodb.net/"
);
var data, sortedData;

const fetchfullData = async () => {
  try {
    data = await client
      .db("GritDB")
      .collection("Members")
      .find()
      .sort({ joiningDate: -1 })
      .limit(50)
      .toArray();
    console.log(data[1]);
  } catch (error) {
    console.log(error);
  }
  return data;
};
const sortData = (data) => {
  sortedData = data.sort((a, b) => {
    // Check if membershipStart exists and is a string
    if (!a.joiningDate || typeof a.joiningDate !== "string") {
      return 1; // Move undefined or non-string values to the end
    }
    if (!b.joiningDate || typeof b.joiningDate !== "string") {
      return -1; // Move undefined or non-string values to the end
    }

    const aDateParts = a.joiningDate.split("-"); // Split by '-'
    const bDateParts = b.joiningDate.split("-");

    // Create Date objects from the parts (YYYY-MM-DD)
    const aDate = new Date(
      `${aDateParts[2]}-${aDateParts[1]}-${aDateParts[0]}`
    );
    const bDate = new Date(
      `${bDateParts[2]}-${bDateParts[1]}-${bDateParts[0]}`
    );

    return bDate - aDate; // Sort in Descending order
  });
};
async function fetchData(limit, offset) {
  try {
    const data = await client
      .db("GritDB")
      .collection("Members")
      .find()
      .skip(offset)
      .limit(limit) // Apply the limit here
      .toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return []; // Return an empty array in case of an error
  }
}

async function insertMember(member) {
  var postStatus;
  try {
    await client.connect();
    const existingMember = await client
      .db("GritDB")
      .collection("Members")
      .findOne({
        name: member.name,
        dateofbirth: member.dateofbirth,
      });
    if (!existingMember) {
      let result = await client
        .db("GritDB")
        .collection("Members")
        .insertOne(member);
      result.acknowledged
        ? console.log("member inserted in DB successfuly")
        : console.log("something went wrong");
      postStatus = result.acknowledged;
    } else {
      console.log(
        "Insert skipped: Member already existing Duplicate entry for name and DOB:",
        member.name,
        member.dateofbirth
      );
    }
  } catch (error) {
    console.log(error);
  }
  return postStatus;
}

var memberDetails;
const parseDate = (date) => {
  const dateParts = date.split("/");
  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  return formattedDate;
};
const fetchMemberDetails = async (id) => {
  try {
    await client.connect();
    memberDetails = await client
      .db("GritDB")
      .collection("Members")
      .find({ _id: new ObjectId(id) });
    // await client.close();
  } catch (error) {
    console.log(error);
  }
};

const updateUser = async () => {
  try {
    console.log(data[1]);
    for (const member of data) {
      // if (member.membershipend && member.status === "converted") {
      //   // Ensure membershipend is a valid date string
      //   const dateParts = member.membershipend.split("-");
      //   if (dateParts.length === 3) {
      //     const [dayStr, monthStr, yearStr] = dateParts;
      //     const day = Number(dayStr);
      //     const month = Number(monthStr);
      //     const year = Number(yearStr);

      //     const parsedExpiryDate = new Date(year, month - 1, day); // Month is 0-indexed
      //     console.log(`Parsed date for ${member.name}: ${parsedExpiryDate}`);

      //     if (
      //       parsedExpiryDate.getDate() === day &&
      //       parsedExpiryDate.getMonth() === month - 1 &&
      //       parsedExpiryDate.getFullYear() === year
      //     ) {
      //       const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
      //       const diffDays = Math.round(
      //         Math.abs((parsedExpiryDate - new Date()) / oneDay)
      //       );

      //       let memberStatus = "";

      //       if (parsedExpiryDate <= new Date()) {
      //         memberStatus = "Expired";
      //       } else if (diffDays <= 3) {
      //         memberStatus = "Expiring soon";
      //       } else {
      //         memberStatus = "Ongoing";
      //       }

      //       // Update the member status in the database
      //       const result = await client
      //         .db("GritDB")
      //         .collection("Members")
      //         .updateMany(
      //           { name: member.name }, // Filter criteria
      //           { $set: { status: memberStatus } }, // Update data
      //           { new: true } // Return the updated document
      //         );

      //       console.log(`Updated member ${member.name}:`, result);
      //     } else {
      //       console.warn(
      //         `Invalid date for member ${member.name}: ${member.membershipend}`
      //       );
      //     }
      //   } else {
      //     console.warn(
      //       `Invalid date format for member ${member.name}: ${member.membershipend}`
      //     );
      //   }
      // } else {
      //   console.warn(`No membership end date for member ${member.name}`);
      // }

      // if (member.joiningDate && member._id) {
      //   // Ensure joiningDate and _id exist
      //   const [day, month, year] = member.joiningDate.split("-").map(Number);
      //   const dateObject = new Date(year, month - 1, day); // Convert to Date object

      //   const result = await client
      //     .db("GritDB")
      //     .collection("Members")
      //     .findOneAndUpdate(
      //       { _id: member._id }, // Use the _id for filtering
      //       { $set: { joiningDate: dateObject } }, // Update the joiningDate field
      //       { returnDocument: "after" } // Return the updated document
      //     );

      //   console.log(`Updated member with ID ${member._id}:`, result);
      // } else {
      //   console.warn(`Missing joining date or _id for member:`, member);
      // }
      const members = await client
        .db("GritDB")
        .collection("Members")
        .find({ joiningDate: { $type: "string" } }) // Find records where joiningDate is a string
        .toArray();

      for (const member of members) {
        const dateString = member.joiningDate; // The string date
        const dateObject = new Date(dateString); // Convert to Date object

        await client
          .db("GritDB")
          .collection("Members")
          .updateOne(
            { _id: member._id }, // Use unique identifier for the update
            { $set: { joiningDate: dateObject } } // Update to Date object
          );
      }
    }
  } catch (error) {
    console.error("Error updating member:", error);
  }

  //   console.log("Updated Users");
  // } catch (error) {
  //   console.error("Error updating user:", error);
  // }
};

app.get("/fetchMemberDetails", (req, res) => {
  const id = req.query.id; // Extract id from query parameters
  fetchMemberDetails(id).catch(console.dir);
  res.send(data);
});

app.get("/data", async (req, res) => {
  await fetchfullData().catch(console.dir);
  res.send(data);
});
app.post("/addmember", async (req, res) => {
  var postStatus;
  postStatus = await insertMember(req.body);
  res.send({ status: postStatus ? "Success" : "failure" });
});

app.post("/api/memberdetail", async (req, res) => {
  try {
    console.log("resposeeeeee", req.body);
    const messageData = req.body;
    addTrialMember(messageData);
    // res.status(201).send({ message: "Message stored successfully!" });
  } catch (error) {
    console.error("Error saving message:", error);
    // res.status(500).send({ error: "Failed to store message" });
  }
});
const addTrialMember = async (member) => {
  member.joiningDate = new Date(member.joiningDate);
  var postStatus;
  postStatus = await insertMember(member);
  console.log("\n\nInsert status::::::", postStatus);
};

app.listen(5000, () => {
  console.log(`Server is running on port: ${5000}`);
});

// Start the WhatsApp client
whatsappClient.initialize();
