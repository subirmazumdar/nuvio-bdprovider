'use strict';

const BASE = "https://cinedoze.tv";

async function getStreams(tmdbId) {
  try {
    const meta = await getMeta(tmdbId);
    if (!meta.title) return [];

    const searchHtml = await fetchText(`${BASE}/?s=${encodeURIComponent(meta.title)}`);
    if (!searchHtml) return [];

    const postUrl = extractPost(searchHtml);
    if (!postUrl) return [];

    const postPage = await fetchText(postUrl);
    if (!postPage) return [];

    const linkPageUrl = postPage.match(/https:\/\/cinedoze\.tv\/links\/[^\s"]+/)?.[0];
    if (!linkPageUrl) return [];

    const linkPage = await fetchText(linkPageUrl);
    if (!linkPage) return [];

    const rawLinks = extractAllLinks(linkPage);

    const streams = [];

    for (let link of rawLinks) {

      if (!isValidHost(link)) continue;

      let final = await deepResolve(link);

      if (final) {
        streams.push({
          name: "Cinedoze",
          title: formatTitle(link),
          url: final,
          quality: detectQuality(link)
        });
      }
    }

    return unique(streams).slice(0, 5);

  } catch {
    return [];
  }
}

module.exports = { getStreams };


// ---------- CORE FIX ----------

async function deepResolve(url) {
  try {
    const html = await fetchText(url);
    if (!html) return null;

    // try direct video
    let m = html.match(/https?:\/\/[^\s"]+\.(m3u8|mp4)/);
    if (m) return m[0];

    // fallback iframe
    let iframe = html.match(/<iframe[^>]+src="([^"]+)"/);
    if (iframe) {
      const iframePage = await fetchText(iframe[1]);
      let v = iframePage?.match(/https?:\/\/[^\s"]+\.(m3u8|mp4)/);
      if (v) return v[0];
    }

    return null;

  } catch {
    return null;
  }
}


// ---------- HELPERS ----------

function extractPost(html) {
  return html.match(/<a href="(https:\/\/cinedoze\.tv\/[^"]+)"/)?.[1];
}

function extractAllLinks(html) {
  return html.match(/https?:\/\/[^\s"<]+/g) || [];
}

function isValidHost(link) {
  return (
    link.includes("hubcloud") ||
    link.includes("gdflix") ||
    link.includes("filepress") ||
    link.includes("streamtape")
  );
}

async function fetchText(url) {
  try {
    return await (await fetch(url)).text();
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
  return link.split("/")[2];
}

function unique(arr) {
  const seen = new Set();
  return arr.filter(x => !seen.has(x.url) && seen.add(x.url));
}

async function getMeta(tmdbId) {
  try {
    const res = await fetch(`https://v3.sg.media-imdb.com/suggestion/x/${tmdbId}.json`);
    const data = await res.json();
    return { title: data?.d?.[0]?.l || "" };
  } catch {
    return {};
  }
}
