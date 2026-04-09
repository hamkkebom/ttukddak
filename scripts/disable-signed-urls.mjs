/**
 * Batch disable requireSignedURLs on all Cloudflare Stream videos
 * Uses time-cursor pagination since CF Stream ignores page param
 */

const ACCOUNT_ID = "***CLOUDFLARE_ACCOUNT_ID_REMOVED***";
const API_TOKEN = "***CLOUDFLARE_API_TOKEN_REMOVED***";
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;

const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json",
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listAllVideos() {
  const allVideos = [];
  const seenUids = new Set();
  let endCursor = null; // will use `created` of last video as cursor
  let batch = 0;

  while (true) {
    batch++;
    // Use `end` param to paginate by creation time (descending order)
    let url = `${BASE_URL}?per_page=1000`;
    if (endCursor) {
      url += `&end=${encodeURIComponent(endCursor)}`;
    }

    console.log(`Batch ${batch}: fetching... ${endCursor ? `(before ${endCursor})` : "(newest first)"}`);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`List failed: ${res.status} ${res.statusText}`);
      break;
    }

    const data = await res.json();
    const videos = data.result || [];

    if (videos.length === 0) {
      console.log("No more videos.");
      break;
    }

    let newCount = 0;
    let oldestCreated = null;
    for (const v of videos) {
      if (!seenUids.has(v.uid)) {
        seenUids.add(v.uid);
        allVideos.push(v);
        newCount++;
      }
      // Track oldest (last) created time in this batch
      if (!oldestCreated || v.created < oldestCreated) {
        oldestCreated = v.created;
      }
    }

    console.log(`  Got ${videos.length}, ${newCount} new (total: ${allVideos.length}), oldest: ${oldestCreated}`);

    if (newCount === 0) {
      console.log("  No new videos — done.");
      break;
    }

    if (videos.length < 1000) {
      console.log("  Last batch (fewer than 1000).");
      break;
    }

    // Use oldest timestamp as cursor for next batch
    endCursor = oldestCreated;
    await sleep(300);
  }

  return allVideos;
}

async function updateVideo(uid) {
  const res = await fetch(`${BASE_URL}/${uid}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ requireSignedURLs: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { uid, success: false, status: res.status, error: text };
  }

  const data = await res.json();
  return { uid, success: data.success };
}

async function main() {
  console.log("=== Listing all videos ===");
  const videos = await listAllVideos();
  console.log(`\nTotal unique videos: ${videos.length}`);

  const needUpdate = videos.filter((v) => v.requireSignedURLs === true);
  console.log(`Videos needing update (requireSignedURLs=true): ${needUpdate.length}`);

  if (needUpdate.length === 0) {
    console.log("Nothing to update!");
    return;
  }

  console.log(`\n=== Updating ${needUpdate.length} videos ===`);

  let updated = 0;
  let failed = 0;
  const BATCH_SIZE = 10;

  for (let i = 0; i < needUpdate.length; i += BATCH_SIZE) {
    const batch = needUpdate.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((v) => updateVideo(v.uid)));

    for (const r of results) {
      if (r.success) {
        updated++;
      } else {
        failed++;
        console.error(`  FAILED ${r.uid}: ${r.status} ${r.error}`);
      }
    }

    const progress = Math.min(i + BATCH_SIZE, needUpdate.length);
    process.stdout.write(
      `\r  Progress: ${progress}/${needUpdate.length} (${updated} ok, ${failed} fail)`
    );

    if (i + BATCH_SIZE < needUpdate.length) {
      await sleep(300);
    }
  }

  console.log(`\n\n=== Done ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
