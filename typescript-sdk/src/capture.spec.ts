import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeClick, onDocumentClick, resolveTarget } from './capture';

describe('resolveTarget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('climbs to the enclosing control when a nested node is clicked', () => {
    document.body.innerHTML = '<button id="cta"><span id="inner">Buy</span></button>';
    const inner = document.getElementById('inner')!;

    expect(resolveTarget(inner)).toBe(document.getElementById('cta'));
  });

  it('keeps the element itself when nothing interactive encloses it', () => {
    document.body.innerHTML = '<div id="plain">text</div>';
    const el = document.getElementById('plain')!;

    expect(resolveTarget(el)).toBe(el);
  });

  it('ignores a null target', () => {
    expect(resolveTarget(null)).toBeNull();
  });
});

describe('describeClick', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.title = 'Demo page';
  });

  it('fills the fields the server requires', () => {
    document.body.innerHTML = '<button id="buy-now">  Buy\n  now  </button>';
    const el = document.getElementById('buy-now')!;

    const event = describeClick(el, new Date('2026-08-21T10:00:00.000Z'));

    expect(event).toMatchObject({
      url: location.href,
      pageTitle: 'Demo page',
      elementTag: 'button',
      elementId: 'buy-now',
      elementText: 'Buy now', // whitespace collapsed
      elementSelector: '#buy-now',
      timestamp: '2026-08-21T10:00:00.000Z',
    });
    expect(event.elementHref).toBeUndefined();
  });

  it('resolves an anchor href to an absolute URL', () => {
    document.body.innerHTML = '<a href="/pricing">Pricing</a>';
    const el = document.querySelector('a')!;

    expect(describeClick(el).elementHref).toBe(new URL('/pricing', location.href).href);
  });

  it('omits empty optional fields rather than sending empty strings', () => {
    document.body.innerHTML = '<button></button>';
    const el = document.querySelector('button')!;

    const event = describeClick(el);
    expect(event.elementId).toBeUndefined();
    expect(event.elementText).toBeUndefined();
  });

  it('truncates text to the server cap of 255 characters', () => {
    document.body.innerHTML = `<button>${'x'.repeat(400)}</button>`;
    const el = document.querySelector('button')!;

    expect(describeClick(el).elementText).toHaveLength(255);
  });
});

describe('onDocumentClick', () => {
  let detach: (() => void) | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    detach?.();
    detach = null;
  });

  it('sees clicks even when the page stops propagation', () => {
    document.body.innerHTML = '<button id="cta">Buy</button>';
    const button = document.getElementById('cta')!;
    button.addEventListener('click', (e) => e.stopPropagation());

    const handler = vi.fn();
    detach = onDocumentClick(handler);

    button.click();

    expect(handler).toHaveBeenCalledWith(button);
  });

  it('stops listening once detached', () => {
    document.body.innerHTML = '<button id="cta">Buy</button>';
    const handler = vi.fn();

    onDocumentClick(handler)();
    document.getElementById('cta')!.click();

    expect(handler).not.toHaveBeenCalled();
  });
});
