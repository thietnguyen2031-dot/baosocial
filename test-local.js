async function test() {
    try {
        const list = await fetch("http://localhost:3001/rss-feeds").then(r => r.json());
        const target = list.find(f => f.id === 3);
        console.log("Before crawlMinute:", target.crawlMinute);

        const payload = { ...target, crawlMinute: 19 };
        console.log("Sending crawlMinute:", payload.crawlMinute);

        const res = await fetch(`http://localhost:3001/rss-feeds/${target.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("PUT status:", res.status);
        const putResult = await res.json();
        console.log("PUT result:", JSON.stringify(putResult, null, 2));

        const listAfter = await fetch("http://localhost:3001/rss-feeds").then(r => r.json());
        const targetAfter = listAfter.find(f => f.id === 3);
        console.log("After crawlMinute:", targetAfter.crawlMinute);

        if (targetAfter.crawlMinute === 19) {
            console.log("✅ SUCCESS: crawlMinute correctly updated to 19!");
        } else {
            console.log("❌ FAILED: Expected 19 but got", targetAfter.crawlMinute);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
