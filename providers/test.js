function getStreams() {
  return new Promise((resolve) => {
    resolve([
      {
        name: "Test",
        title: "Working",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        quality: "720p"
      }
    ]);
  });
}

module.exports = { getStreams };
