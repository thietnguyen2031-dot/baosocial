async function test() {
    try {
        const list = await fetch("https://baosocial-api.onrender.com/rss-feeds").then(r => r.json());
        const target = list.find(f => f.id === 3);
        console.log("Before:", target.crawlMinute);

        const payload = { ...target, crawlMinute: 31 };
        console.log("Sending payload crawlMinute:", payload.crawlMinute);

        const res = await fetch(`https://baosocial-api.onrender.com/rss-feeds/${target.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("PUT status:", res.status);
        const putResult = await res.json();
        console.log("PUT result full:", JSON.stringify(putResult, null, 2));

        const listAfter = await fetch("https://baosocial-api.onrender.com/rss-feeds").then(r => r.json());
        const targetAfter = listAfter.find(f => f.id === 3);
        console.log("After:", targetAfter.crawlMinute);
    } catch (e) {
        console.error(e);
    }
}
test();
