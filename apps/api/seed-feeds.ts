
const feeds = [
    { url: 'https://vnexpress.net/rss/kinh-doanh.rss', source: 'VnExpress', category: 'Kinh Tế' },
    { url: 'https://baoquocte.vn/rss_feed/kinh-te', source: 'Báo Quốc Tế', category: 'Kinh Tế' },
    { url: 'https://vnexpress.net/rss/giai-tri.rss', source: 'VnExpress', category: 'Văn Hóa' },
    { url: 'https://vnexpress.net/rss/the-thao.rss', source: 'VnExpress', category: 'Thể Thao' },
    { url: 'https://vnexpress.net/rss/so-hoa.rss', source: 'VnExpress', category: 'Video' },
    { url: 'https://vnexpress.net/rss/thoi-su.rss', source: 'VnExpress', category: 'Tin Nổi Bật' },
];

async function seed() {
    for (const feed of feeds) {
        try {
            const res = await fetch('http://localhost:3001/rss-feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feed)
            });
            const data = await res.json();
            console.log('Added:', data.source, data.category);
        } catch (e) {
            console.error('Failed to add:', feed.source);
        }
    }
}

seed();
