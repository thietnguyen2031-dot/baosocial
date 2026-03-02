import { sql } from "drizzle-orm";

const id = 3;
const parsedMinute = 27;

const query = sql`UPDATE rss_feeds SET crawl_minute = ${parsedMinute} WHERE id = ${id}`;
console.log(query);
