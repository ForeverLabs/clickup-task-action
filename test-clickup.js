// Test script to verify ClickUp API
const axios = require("axios");

const CU_TOKEN = "your_token_here"; // Replace with your actual token
const LIST_ID = "your_list_id_here"; // Replace with your actual list ID

async function testClickUp() {
  try {
    console.log("Testing ClickUp API...");

    // Test API authentication
    const authTest = await axios.get("https://api.clickup.com/api/v2/user", {
      headers: { Authorization: CU_TOKEN },
    });
    console.log("✅ Authentication successful:", authTest.data.user.username);

    // Test list access
    const listTest = await axios.get(`https://api.clickup.com/api/v2/list/${LIST_ID}`, {
      headers: { Authorization: CU_TOKEN },
    });
    console.log("✅ List access successful:", listTest.data.name);

    // Test task creation
    const taskTest = await axios.post(
      `https://api.clickup.com/api/v2/list/${LIST_ID}/task`,
      {
        name: "Test task from API",
        description: "This is a test task created via API",
        tags: ["test"],
        priority: 2,
      },
      {
        headers: {
          Authorization: CU_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Task creation successful:", taskTest.data.id);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testClickUp();
