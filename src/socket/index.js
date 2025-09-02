module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 connected:", socket.id);

    // tiny ping test
    socket.on("ping", (data, cb) => {
      cb?.({ ok: true, echo: data ?? null });
    });

    socket.on("disconnect", () => {
      console.log("❌ disconnected:", socket.id);
    });
  });
};
