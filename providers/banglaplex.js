function getStreams() {
  return new Promise((resolve) => {

    let streams = [];

    fetch("https://banglaplex.click/")
      .then(res => res.text())
      .then(html => {

        if (!html) return resolve([]);

        // STEP 1: get paste link
        let match = html.match(/https:\/\/pasteurl\.net\/view\/[^\s"]+/);

        if (!match) return resolve([]);

        return fetch(match[0]);
      })
      .then(res => res ? res.text() : null)
      .then(page => {

        if (!page) return resolve([]);

        // STEP 2: extract all links
        let links = page.match(/https?:\/\/[^\s"<]+/g) || [];

        let hostLinks = links.filter(link =>
          link.includes("streamtape") ||
          link.includes("gdflix") ||
          link.includes("filepress")
        );

        if (hostLinks.length === 0) return resolve([]);

        let pending = hostLinks.length;

        hostLinks.forEach(link => {

          resolveHost(link).then(video => {

            if (video) {
              streams.push({
                name: "BanglaPlex",
                title: formatTitle(link),
                url: video,
                quality: detectQuality(link)
              });
            }

            pending--;
            if (pending === 0) resolve(streams);

          }).catch(() => {
            pending--;
            if (pending === 0) resolve(streams);
          });

        });

      })
      .catch(() => resolve([]));

  });
}

module.exports = { getStreams };


// -------- resolver --------

function resolveHost(url) {
  return new Promise((resolve) => {

    fetch(url)
      .then(res => res.text())
      .then(html => {

        if (!html) return resolve(null);

        // direct stream extraction
        let video = html.match(/https?:\/\/[^\s"]+\.(m3u8|mp4)/);

        if (video) return resolve(video[0]);

        resolve(null);
      })
      .catch(() => resolve(null));

  });
}


// -------- helpers --------

function detectQuality(link) {
  if (link.includes("2160")) return "4K";
  if (link.includes("1080")) return "1080p";
  if (link.includes("720")) return "720p";
  return "HD";
}

function formatTitle(link) {
  let source = "BanglaPlex";

  if (link.includes("gdflix")) source = "GDFlix";
  if (link.includes("streamtape")) source = "StreamTape";
  if (link.includes("filepress")) source = "FilePress";

  return source + " - " + detectQuality(link);
}
