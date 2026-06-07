const revealItems = document.querySelectorAll("[data-reveal]");
const glow = document.querySelector(".cursor-glow");
const canvas = document.querySelector(".starfield");
const context = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
  revealObserver.observe(item);
});

document.addEventListener("pointermove", (event) => {
  if (!glow || prefersReducedMotion || window.innerWidth < 760) return;
  glow.style.setProperty("--x", `${event.clientX}px`);
  glow.style.setProperty("--y", `${event.clientY}px`);
});

let stars = [];
let width = 0;
let height = 0;
let animationFrame = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const starLimit = width < 760 ? 36 : 80;
  const starCount = Math.floor(Math.min(starLimit, Math.max(28, width / 18)));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() > 0.82 ? 3 : 2,
    speed: 0.04 + Math.random() * 0.1,
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawStars(time = 0) {
  context.clearRect(0, 0, width, height);
  stars.forEach((star) => {
    const twinkle = 0.4 + Math.sin(time * 0.0015 + star.phase) * 0.28;
    context.fillStyle = `rgba(255, 244, 215, ${twinkle})`;
    context.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
    if (!prefersReducedMotion) {
      star.y += star.speed;
      if (star.y > height + 4) {
        star.y = -4;
        star.x = Math.random() * width;
      }
    }
  });

  if (!prefersReducedMotion) {
    animationFrame = window.requestAnimationFrame(drawStars);
  }
}

resizeCanvas();
drawStars();
window.addEventListener("resize", resizeCanvas);

document.querySelectorAll(".post-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.animate(
      [
        { transform: "translateY(-6px)" },
        { transform: "translateY(-6px) rotate(1deg)" },
        { transform: "translateY(-6px)" },
      ],
      { duration: 220, easing: "steps(3, end)" }
    );
  });
});

window.addEventListener("pagehide", () => {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
  }
});
