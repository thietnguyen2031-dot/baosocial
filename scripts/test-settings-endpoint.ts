// Test if Settings POST endpoint works
async function testSaveSettings() {
    console.log("🧪 Testing Settings Save Endpoint...\n");

    const testKey = "AIzaSyBkyCCBIqzas7IQ0hz7TK5VbyVGQRGirPU"; // User's Tier 1 key

    try {
        const response = await fetch("http://localhost:3001/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                key: "gemini_api_keys",
                value: testKey,
                description: "Test save"
            })
        });

        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);

        if (response.ok) {
            console.log("\n✅ Save successful! Now testing retrieval...\n");

            // Test retrieval
            const getResponse = await fetch("http://localhost:3001/settings");
            const settings = await getResponse.json();
            console.log("All settings:", settings);

            const keySetting = settings.find((s: any) => s.key === "gemini_api_keys");
            if (keySetting) {
                console.log("\n✅ Key found in DB:");
                console.log("  Value:", keySetting.value);
            } else {
                console.log("\n❌ Key NOT found in retrieved settings!");
            }
        } else {
            console.log("\n❌ Save failed!");
        }
    } catch (e: any) {
        console.error("\n❌ Error:", e.message);
    }
}

testSaveSettings();
