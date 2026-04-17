function getStreams(tmdbId, mediaType) {
  return new Promise((resolve) => {

    let streams = [];

    // Use public API (no key required alternative)
    fetch("https://v3.sg.media-imdb.com/suggestion/x/" + tmdbId + ".json")
      .then(res => res.json())
      .then(data => {

        let title = "";

        if (data && data.d && data.d[0]) {
          title = data.d[0].l;
        }

        if (!title) return resolve([]);

        return fetch("https://cinedoze.tv/?s=" + encodeURIComponent(title));
      })
      .then(res => res ? res.text() : null)
      .then(html => {

        if (!html) return resolve([]);

        let match = html.match(/href="(https:\/\/cinedoze\.tv\/[^"]+)"/);

        if (!match) return resolve([]);

        return fetch(match[1]);
      })
      .then(res => res ? res.text() : null)
      .then(page => {

        if (!page) return resolve([]);

        let links = page.match(/https?:\/\/[^\s"<]+/g) || [];

        links.forEach(link => {
          if (
            link.includes("gdflix") ||
            link.includes("hubcloud") ||
            link.includes("filepress")
          ) {
            streams.push({
              name: "Cinedoze",
              title: "Stream",
              url: link,
              quality: "HD"
            });
          }
        });

        resolve(streams);
      })
      .catch(() => resolve([]));

  });
}

module.exports = { getStreams };
