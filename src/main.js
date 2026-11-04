import './styles.css';
import { Stage } from './render/stage.js';
import { createState, step, derive, DT, setRodTarget, scram, recover } from './sim/model.js';

const host = document.getElementById('stage');
const s = createState('rated');
const stage = new Stage(host, { onPick: (p) => console.log('pick', p) });
stage.warm(s, derive(s));
window.__app = { s, stage, setRodTarget, scram, recover, derive, step };
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  acc += dt; let n = 0;
  while (acc >= DT && n < 10) { step(s); acc -= DT; n++; }
  if (n === 10) acc = 0;
  const d = derive(s);
  stage.frame(s, d, dt, dt);
  stage.live(s, d);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
