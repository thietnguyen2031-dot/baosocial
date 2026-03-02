async function test() {
    try {
        const list = await fetch("https://baosocial-api.onrender.com/rss-feeds").then(r => r.json());
        const target = list.find(f => f.id === 3);
        console.log("Before:", target.crawlMinute);

        const payload = { ...target, crawlMinute: 31 };
        const res = await fetch(`https://baosocial-api.onrender.com/rss-feeds/${target.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("PUT status:", res.status);
        console.log("PUT result:", await res.json());

        const listAfter = await fetch("https://baosocial-api.onrender.com/rss-feeds").then(r => r.json());
        const targetAfter = listAfter.find(f => f.id === 3);
        console.log("After:", targetAfter.crawlMinute);
    } catch (e) {
        console.error(e);
    }
}
test();
