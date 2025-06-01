import { preload, init, update, draw } from './game';

const canvas = document.getElementById('cnvs');
canvas.width = 600;
canvas.height = 590;

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = (canvas.width - btnWidth) / 2;
    const btnY = canvas.height / 2 + 50;

    if (
        mx >= btnX && mx <= btnX + btnWidth &&
        my >= btnY && my <= btnY + btnHeight
    ) {
        init(canvas);
    }
});

let lastTime = 0;

function run(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;

    update(delta);

    draw(canvas, timestamp);

    lastTime = timestamp;
    requestAnimationFrame(run);
}

function onPreloadComplete() {
    init(canvas);
    requestAnimationFrame(run);
}

preload(() => {
    init(canvas);
    requestAnimationFrame(run);
});
