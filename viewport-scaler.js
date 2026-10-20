// Uniform 16:9 logical canvas. The entire game is scaled as one surface.
// CSS breakpoints for game content use @container game-viewport instead of
// the physical browser viewport; this prevents overlapping controls on phones.
(() => {
  const WIDTH = 960, HEIGHT = 540;
  const host = document.getElementById("game-container");
  const canvas = document.getElementById("game");
  if (!host || !canvas) return;

  Object.assign(canvas.style, {
    position: "absolute",
    width: WIDTH + "px",
    height: HEIGHT + "px",
    maxWidth: "none",
    left: "0",
    top: "0",
    transformOrigin: "top left"
  });

  function fitCanvas() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(width / WIDTH, height / HEIGHT);
    canvas.style.left = ((width - WIDTH * scale) / 2) + "px";
    canvas.style.top = ((height - HEIGHT * scale) / 2) + "px";
    canvas.style.transform = "scale(" + scale + ")";
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(fitCanvas).observe(host);
  }
  window.addEventListener("resize", fitCanvas, { passive: true });
  window.visualViewport?.addEventListener("resize", fitCanvas, { passive: true });
  fitCanvas();
})();
