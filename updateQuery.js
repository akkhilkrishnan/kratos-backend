const updateUser = async (fulldata) => {
  try {
    console.log(fulldata[1]);
    if (fulldata)
      for (const member of fulldata) {
        if (member.membershipend && member.status === "converted") {
          // Ensure membershipend is a valid date string
          const dateParts = member.membershipend.split("-");
          if (dateParts.length === 3) {
            const [dayStr, monthStr, yearStr] = dateParts;
            const day = Number(dayStr);
            const month = Number(monthStr);
            const year = Number(yearStr);

            // Validate the parsed date
            const parsedExpiryDate = new Date(year, month - 1, day); // Month is 0-indexed

            // Additional debug log for parsed dates
            console.log(`Parsed date for ${member.name}: ${parsedExpiryDate}`);

            if (
              parsedExpiryDate.getDate() === day &&
              parsedExpiryDate.getMonth() === month - 1 &&
              parsedExpiryDate.getFullYear() === year
            ) {
              const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
              const diffDays = Math.round(
                Math.abs((parsedExpiryDate - new Date()) / oneDay)
              );

              let memberStatus = "";

              if (parsedExpiryDate <= new Date()) {
                memberStatus = "Expired";
              } else if (diffDays <= 3) {
                memberStatus = "Expiring soon";
              } else {
                memberStatus = "Ongoing";
              }

              // Update the member status in the database
              const result = await client
                .db("GritDB")
                .collection("Members")
                .updateMany(
                  { name: member.name }, // Filter criteria
                  { $set: { status: memberStatus } }, // Update data
                  { new: true } // Return the updated document
                );

              console.log(`Updated member ${member.name}:`, result);
            } else {
              console.warn(
                `Invalid date for member ${member.name}: ${member.membershipend}`
              );
            }
          } else {
            console.warn(
              `Invalid date format for member ${member.name}: ${member.membershipend}`
            );
          }
        } else {
          console.warn(`No membership end date for member ${member.name}`);
        }
      }

    console.log("Updated Users");
  } catch (error) {
    console.error("Error updating user:", error);
  }
};

module.exports = updateUser;
