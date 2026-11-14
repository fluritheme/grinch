import { createGrinch, type GrinchController } from '../src/index.js';
declare global {
  interface Window {
    grinch: GrinchController;
  }
}
const get = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let visitor: GrinchController,
  paused = false;
function mount(): void {
  visitor?.destroy();
  paused = false;
  get('pause').textContent = 'Ⅱ Pause mischief';
  get('pause').setAttribute('aria-pressed', 'false');
  visitor = createGrinch({
    targets: '[data-grinch-gift]',
    entrance: 'rope',
    size: Number(get<HTMLInputElement>('size').value),
    speed: Number(get<HTMLInputElement>('speed').value),
    fearRadius: get<HTMLInputElement>('shy').checked ? 90 : 0,
    cooldown: 9,
  });
  window.grinch = visitor;
}
mount();
let toastTimer: ReturnType<typeof setTimeout>;
function toast(message: string): void {
  get('toast').textContent = message;
  get('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    get('toast').hidden = true;
  }, 3500);
}
get('steal').addEventListener('click', () => {
  if (visitor.getState().reducedMotion) {
    toast('Your reduced-motion preference is on. The resident stays still.');
    return;
  }
  if (paused) {
    toast('Resume mischief to start a heist.');
    return;
  }
  visitor.update({ mood: 'mischievous' });
  if (!visitor.steal())
    toast('He is finishing his current little routine. The next present can wait.');
});
get('shoo').addEventListener('click', () => {
  visitor.shoo();
  toast('Caught in the act. A little present is on its way home.');
});
get('redeem').addEventListener('click', () => {
  visitor.redeem();
  toast('A little kindness. The presents are coming home.');
});
get('return').addEventListener('click', () => visitor.returnGifts());
get('restart').addEventListener('click', () => {
  mount();
  toast('Fresh presents. Same questionable plans.');
});
get('pause').addEventListener('click', () => {
  paused = !paused;
  if (paused) visitor.pause();
  else visitor.resume();
  get('pause').textContent = paused ? '▷ Resume mischief' : 'Ⅱ Pause mischief';
  get('pause').setAttribute('aria-pressed', String(paused));
});
for (const key of ['size', 'speed'] as const)
  get<HTMLInputElement>(key).addEventListener('input', () => {
    const value = Number(get<HTMLInputElement>(key).value);
    get(`${key}-value`).textContent = `${value.toFixed(1)}×`;
    visitor.update({ [key]: value });
  });
get<HTMLInputElement>('shy').addEventListener('change', () =>
  visitor.update({ fearRadius: get<HTMLInputElement>('shy').checked ? 90 : 0 }),
);
const labels: Record<string, string> = {
  arriving: 'MAKING AN ENTRANCE',
  idle: 'PLANNING SOMETHING',
  sneaking: 'ON THE NICE LIST? NOT TODAY.',
  climbing: 'TAKING THE SCENIC ROUTE',
  reaching: 'JUST BORROWING THIS…',
  stealing: 'ONE LITTLE PRESENT',
  stashing: 'ROOM FOR ONE MORE',
  gloating: 'SUSPICIOUSLY PLEASED',
  escaping: 'NOTHING TO SEE HERE',
  hiding: 'A VERY INNOCENT CARD',
  peeking: 'IS THE COAST CLEAR?',
  caught: 'CAUGHT IN THE ACT',
  warming: 'A LITTLE HEART GOES A LONG WAY',
  waving: 'TRYING TO LOOK INNOCENT',
};
let status: ReturnType<typeof setInterval>;
function startStatus(): void {
  clearInterval(status);
  status = setInterval(() => {
    const s = visitor.getState(),
      label = s.reducedMotion
        ? 'A STILL LITTLE RESIDENT'
        : paused
          ? 'TAKING A LITTLE BREAK'
          : s.mood === 'friendly'
            ? 'A SOFTER SIDE OF GREEN'
            : (labels[s.phase] ?? s.phase);
    for (const [id, text] of [
      ['activity', label],
      ['stolen-count', String(s.stolen)],
      ['gift-count', String(s.gifts.length)],
    ] as const)
      if (get(id).textContent !== text) get(id).textContent = text;
  }, 350);
}
startStatus();
const examples = {
  typescript: `import { createGrinch } from '@fluritheme/grinch';\n\nconst visitor = createGrinch({\n  targets: '[data-grinch-gift]',\n  mood: 'mischievous',\n});\n\n// A little kindness changes the story.\nvisitor.redeem();\n\n// Clean up when your page unmounts.\nvisitor.destroy();`,
  react: `import { useEffect } from 'react';\nimport { createGrinch } from '@fluritheme/grinch';\n\nexport function HolidayVisitor() {\n  useEffect(() => {\n    const visitor = createGrinch();\n    return () => visitor.destroy();\n  }, []);\n\n  return <article data-grinch-gift>\n    A little room for a present.\n  </article>;\n}`,
  vue: `<script setup>\nimport { onMounted, onUnmounted } from 'vue';\nimport { createGrinch } from '@fluritheme/grinch';\nlet visitor;\nonMounted(() => visitor = createGrinch());\nonUnmounted(() => visitor?.destroy());\n</script>\n\n<template>\n  <article data-grinch-gift>\n    A little room for a present.\n  </article>\n</template>`,
};
let active: keyof typeof examples = 'typescript';
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-code]')];
function selectTab(button: HTMLButtonElement): void {
  active = button.dataset.code as keyof typeof examples;
  for (const tab of tabs) {
    tab.setAttribute('aria-selected', String(tab === button));
    tab.tabIndex = tab === button ? 0 : -1;
  }
  get('code-content').textContent = examples[active];
  get('code').setAttribute('aria-labelledby', button.id);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    let next: number | undefined;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      e.preventDefault();
      selectTab(tabs[next]!);
      tabs[next]!.focus();
    }
  });
});
async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied. Make a little room for mischief.');
  } catch {
    toast('Select and copy the command or example to your clipboard.');
  }
}
get('copy-install').addEventListener('click', () => {
  void copy('npm i @fluritheme/grinch');
});
get('copy-code').addEventListener('click', () => {
  void copy(examples[active]);
});
window.addEventListener('pagehide', () => {
  visitor.destroy();
  clearInterval(status);
  clearTimeout(toastTimer);
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    mount();
    startStatus();
  }
});

const hero = document.querySelector<HTMLElement>('.hero')!;
const environments = [...document.querySelectorAll<HTMLButtonElement>('[data-theme]')];
for (const button of environments)
  button.addEventListener('click', () => {
    const theme = button.dataset.theme;
    if (!theme || !['evergreen', 'paper', 'dark'].includes(theme)) return;
    hero.classList.remove('evergreen', 'paper', 'dark');
    hero.classList.add(theme);
    for (const candidate of environments)
      candidate.setAttribute('aria-pressed', String(candidate === button));
    visitor.refresh();
  });
