'use strict';

const BASE = "https://cinedoze.tv";

async function getStreams(tmdbId, type) {
  try {

    const meta = await getMeta(tmdbId, type);
    if (!meta.title) return [];

    // STEP 1: search (simple fallback)
    const searchUrl = `${BASE}/?s=${encodeURIComponent(meta.title)}`;
    const html = await fetchText(searchUrl);
    if (!html) return [];

    const pageUrl = extractFirstPost(html);
    if (!pageUrl) return [];

    // STEP 2: open movie page
    const page = await fetchText(pageUrl);
    if (!page) return [];

    // STEP 3: get /links/ page
    const linkMatch = page.match(/https:\/\/cinedoze\.tv\/links\/[^\s"]+/);
    if (!linkMatch) return [];

    const linkPage = await fetchText(linkMatch[0]);
    if (!linkPage) return [];

    // STEP 4: extract host links
    const links = linkPage.match(/https?:\/\/[^\s"<]+/g) || [];

    const streams = [];

    for (let link of links) {
      if (
        link.includes("hubcloud") ||
        link.includes("gdflix") ||
        link.includes("filepress")
      ) {

        let video = await resolveHost(link);
        if (video) {
          streams.push({
            name: "Cinedoze",
            title: formatTitle(link),
            url: video,
            quality: detectQuality(link)
          });
        }
      }
    }

    return streams.slice(0, 5);

  } catch {
    return [];
  }
}

module.exports = { getStreams };


// ----------------------
// HELPERS
// ----------------------

async function fetchText(url) {
  try {
    const res = await fetch(url);
    return await res.text();
  } catch {
    return null;
  }
}

function extractFirstPost(html) {
  const m = html.match(/<a href="(https:\/\/cinedoze\.tv\/[^"]+)"/);
  return m ? m[1] : null;
}

async function resolveHost(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const m = html.match(/https?:\/\/[^\s"]+\.(m3u8|mp4)/);
    return m ? m[0] : null;
  } catch {
    return null;
  }
}

function detectQuality(name) {
  name = name.toLowerCase();
  if (name.includes("2160")) return "4K";
  if (name.includes("1080")) return "1080p";
  if (name.includes("720")) return "720p";
  return "HD";
}

function formatTitle(link) {
  if (link.includes("gdflix")) return "GDFlix";
  if (link.includes("hubcloud")) return "HubCloud";
  if (link.includes("filepress")) return "FilePress";
  return "Stream";
}

async function getMeta(tmdbId, type) {
  try {
    const res = await fetch(`https://v3.sg.media-imdb.com/suggestion/x/${tmdbId}.json`);
    const data = await res.json();
    return { title: data?.d?.[0]?.l || "" };
  } catch {
    return {};
  }
}
