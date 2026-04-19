function getStreams(tmdbId, type) {
  return new Promise((resolve) => {

    let results = [];
    let BASE = "http://10.16.100.244/";
    let MAX_ITEMS = 25;

    fetch("https://v3.sg.media-imdb.com/suggestion/x/" + tmdbId + ".json")
      .then(res => res.json())
      .then(data => {

        let title = "";

        if (data && data.d && data.d[0]) {
          title = data.d[0].l || "";
        }

        if (!title) return resolve([]);

        let search = normalize(title);

        fetch(BASE + "dashboard.php?category=2")
          .then(res => res.text())
          .then(html => {

            if (!html) return resolve([]);

            let links = [...html.matchAll(/player\.php[^\"]+/g)]
              .map(m => m[0])
              .slice(0, MAX_ITEMS);

            let pending = links.length;
            if (pending === 0) return resolve([]);

            links.forEach(link => {

              fetch(BASE + link)
                .then(res => res.text())
                .then(page => {

                  if (!page) return done();

                  let video = page.match(/http:\/\/10\.16\.100\.213[^\s"]+\.mp4/);

                  if (video) {

                    let file = video[0];
                    let filename = file.split("/").pop();

                    let score = calculateScore(search, filename);

                    if (score > 0) {

                      results.push({
                        name: "BDIX ICC",
                        title: cleanTitle(filename),
                        url: file,
                        quality: detectQuality(filename),
                        score: score
                      });

                    }
                  }

                  done();

                })
                .catch(done);

            });

            function done() {
              pending--;
              if (pending === 0) finalize();
            }

            function finalize() {

              if (results.length === 0) {
                return resolve([{
                  name: "BDIX ICC",
                  title: "No match found",
                  url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                  quality: "720p"
                }]);
              }

              // 🔥 SORT by score + quality
              results.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return qualityRank(b.quality) - qualityRank(a.quality);
              });

              // remove score before returning
              let finalStreams = results.slice(0, 5).map(r => ({
                name: r.name,
                title: r.title,
                url: r.url,
                quality: r.quality
              }));

              resolve(finalStreams);
            }

          });

      })
      .catch(() => resolve([]));

  });
}

module.exports = { getStreams };


// ----------------------
// HELPERS
// ----------------------

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// 🔥 scoring system
function calculateScore(search, filename) {

  let file = normalize(filename);

  let score = 0;

  let words = search.split(" ");

  words.forEach(word => {
    if (file.includes(word)) score += 2;
  });

  // exact match boost
  if (file.includes(search)) score += 5;

  return score;
}


// 🔥 quality detection
function detectQuality(name) {
  name = name.toLowerCase();

  if (name.includes("2160")) return "4K";
  if (name.includes("1080")) return "1080p";
  if (name.includes("720")) return "720p";

  return "HD";
}


// 🔥 quality ranking
function qualityRank(q) {
  if (q === "4K") return 4;
  if (q === "1080p") return 3;
  if (q === "720p") return 2;
  return 1;
}


// clean title
function cleanTitle(name) {
  return name
    .replace(/\./g, " ")
    .replace(/\b(mp4|mkv)\b/i, "")
    .trim();
}
