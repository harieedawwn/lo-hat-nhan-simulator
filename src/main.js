import { createState, run, derive } from './sim/model.js';
const s = createState('rated'); run(s, 60);
const d = derive(s);
document.getElementById('app').insertAdjacentHTML('beforeend',
  `<p>P nhiệt ${d.pTh.toFixed(0)} MW · P điện ${d.pe.toFixed(0)} MW · k = ${s.k.toFixed(3)}</p>`);
