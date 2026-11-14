import { describe, it, expect } from 'vitest';
import { Mischief } from '../src/model.js';
import { resolveOptions, validateTuning } from '../src/options.js';
import { createGrinch } from '../src/index.js';
const view = { x: 0, y: 0, width: 900, height: 800 };
function setup(extra = {}) {
  const options = resolveOptions({ entrance: 'appear', autoSteal: false, fearRadius: 0, ...extra });
  const m = new Mischief(options);
  m.gifts = [
    {
      id: 'one',
      position: { x: 350, y: 300 },
      state: 'available',
      visible: true,
      color: '#ee3344',
      returning: null,
    },
    {
      id: 'two',
      position: { x: 650, y: 500 },
      state: 'available',
      visible: true,
      color: '#22aa44',
      returning: null,
    },
  ];
  m.spawn(view);
  return m;
}
function advance(m: Mischief, seconds: number) {
  for (let t = 0; t < seconds; t += 0.025) m.step(0.025, view, [], null);
}
function until(m: Mischief, predicate: () => boolean) {
  for (let i = 0; i < 3000 && !predicate(); i++) m.step(0.025, view, [], null);
  expect(predicate()).toBe(true);
}
describe('the holiday routine', () => {
  it('approaches and picks up a present before counting a theft', () => {
    const m = setup(),
      g = m.gifts[0]!;
    expect(m.steal(g)).toBe(true);
    until(m, () => g.state === 'held');
    expect(m.totalStolen).toBe(0);
    expect(Math.abs(m.actor.x - g.position.x)).toBeCloseTo(28, 0);
    expect(m.actor.y).toBeCloseTo(g.position.y, 0);
    until(m, () => g.state === 'stolen');
    expect(m.totalStolen).toBe(1);
    expect(m.stolen).toBe(1);
  });
  it('climbs to another ledge and does not teleport a gift', () => {
    const m = setup(),
      g = m.gifts[1]!;
    m.steal(g);
    until(m, () => m.actor.phase === 'climbing');
    expect(g.state).toBe('available');
    expect(m.actor.rope).not.toBeNull();
    until(m, () => g.state === 'stolen');
    expect(m.actor.y).toBeCloseTo(500, 0);
  });
  it('returns a held gift to its moving anchor when caught', () => {
    const m = setup(),
      g = m.gifts[0]!;
    m.steal(g);
    until(m, () => m.actor.phase === 'stashing');
    m.shoo();
    expect(g.state).toBe('returning');
    expect(m.totalStolen).toBe(0);
    g.position = { x: 520, y: 390 };
    advance(m, 1);
    expect(g.state).toBe('available');
    expect(m.giftPoint(g)).toEqual(g.position);
    expect(m.caught).toBe(1);
  });
  it('returns the sack and stops automatic theft after kindness', () => {
    const m = setup({ autoSteal: true }),
      g = m.gifts[0]!;
    until(m, () => g.state === 'stolen');
    m.redeem();
    advance(m, 20);
    expect(m.gifts.every((g) => g.state === 'available')).toBe(true);
    expect(m.stolen).toBe(0);
    expect(m.totalStolen).toBe(1);
    expect(m.steal()).toBe(false);
  });
  it('keeps paused time fixed and cancels an invalid target', () => {
    const m = setup({ autoSteal: true });
    m.step(0, view, [], null);
    expect(m.actor.phase).toBe('idle');
    expect(m.time).toBe(0);
    m.steal();
    m.gifts = [];
    advance(m, 0.1);
    expect(m.actor.phase).toBe('idle');
  });
  it('uses a real shelter, peeks and climbs out', () => {
    const m = setup(),
      shelters = [{ id: 'card', box: { x: 250, y: 300, width: 300, height: 250 } }];
    m.steal();
    let hidden = false,
      peeked = false;
    for (let i = 0; i < 1700; i++) {
      m.step(0.025, view, shelters, null);
      hidden ||= m.actor.phase === 'hiding';
      peeked ||= m.actor.phase === 'peeking';
    }
    expect(hidden).toBe(true);
    expect(peeked).toBe(true);
    expect(m.actor.behind).toBe(false);
    expect(m.actor.y).toBeCloseTo(300, 0);
  });
  it('immediate return preserves the gift count', () => {
    const m = setup();
    m.gifts[0]!.state = 'stolen';
    m.gifts[1]!.state = 'held';
    m.returnGifts(true);
    expect(m.gifts).toHaveLength(2);
    expect(m.gifts.every((g) => g.state === 'available' && g.returning === null)).toBe(true);
  });
});
describe('public configuration', () => {
  it.each([
    { size: NaN },
    { speed: Infinity },
    { maxGifts: 1.2 },
    { cooldown: 0 },
    { furColor: 'url(foo)' },
    { targets: '' },
    { objects: ' ' },
    { unknown: true },
    { motion: 'fast' },
    { autoSteal: 'yes' },
    null,
    [],
  ])('rejects malformed configuration %j', (input) => {
    expect(() => resolveOptions(input as never)).toThrow();
  });
  it('only accepts live tuning keys', () => {
    expect(() => validateTuning({ targets: 'article' } as never)).toThrow();
    expect(() => validateTuning({ speed: 1.5 })).not.toThrow();
  });
  it('supports safe server rendering and repeated teardown', () => {
    const g = createGrinch();
    expect(g.getState().state).toBe('idle');
    expect(g.steal()).toBe(false);
    g.redeem();
    expect(g.getState().mood).toBe('friendly');
    g.destroy();
    g.destroy();
    expect(g.getState().state).toBe('destroyed');
  });
});

it('honors the cooldown after a successful heist', () => {
  const m = setup({ autoSteal: true, cooldown: 120 });
  until(m, () => m.totalStolen === 1);
  advance(m, 45);
  expect(m.totalStolen).toBe(1);
});
