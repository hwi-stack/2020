import confetti from 'canvas-confetti';

export function fireGrandCelebration() {
  const duration = 4.5 * 1000;
  const animationEnd = Date.now() + duration;

  // Immediate powerful center blast
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#ff0055', '#ff9900', '#ffea00', '#00ff66', '#00ccff', '#9933ff', '#ffffff'],
    scalar: 1.2,
  });

  // Staggered fireworks cannons from left and right
  const interval: number = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 60 * (timeLeft / duration);

    // Left cannon
    confetti({
      particleCount,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.7 },
      colors: ['#ff3366', '#ffaa00', '#33ccff', '#ffff00', '#8844ff'],
      scalar: 1.1,
      drift: 0.1,
    });

    // Right cannon
    confetti({
      particleCount,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.7 },
      colors: ['#ff0088', '#00ffcc', '#ffcc00', '#4488ff', '#ffffff'],
      scalar: 1.1,
      drift: -0.1,
    });

    // Occasional star burst from center
    if (Math.random() < 0.4) {
      confetti({
        particleCount: 35,
        spread: 360,
        ticks: 80,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.3 },
        shapes: ['circle', 'square'],
        colors: ['#ffd700', '#ff69b4', '#00fa9a', '#1e90ff', '#ff4500'],
      });
    }
  }, 220);
}
