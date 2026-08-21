import { beforeEach, describe, expect, it } from 'vitest';
import { buildSelector } from './selector';

function render(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

describe('buildSelector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('uses the element id alone when it has one', () => {
    render('<div class="wrap"><button id="buy-now">Buy</button></div>');
    const el = document.getElementById('buy-now')!;

    expect(buildSelector(el)).toBe('#buy-now');
  });

  it('stops climbing at the first ancestor id', () => {
    render('<section id="hero"><div><button>Buy</button></div></section>');
    const el = document.querySelector('button')!;

    expect(buildSelector(el)).toBe('#hero > div > button');
  });

  it('omits nth-of-type when the tag is unique among its siblings', () => {
    render('<div id="row"><span>label</span><button>Go</button></div>');
    const el = document.querySelector('button')!;

    expect(buildSelector(el)).toBe('#row > button');
  });

  it('disambiguates repeated siblings by position', () => {
    render('<ul id="menu"><li>one</li><li>two</li><li>three</li></ul>');
    const el = document.querySelectorAll('li')[1]!;

    expect(buildSelector(el)).toBe('#menu > li:nth-of-type(2)');
  });

  it('produces a selector that actually matches the element back', () => {
    render('<main><div><p>a</p><p>b</p></div></main>');
    const el = document.querySelectorAll('p')[1]!;

    expect(document.querySelector(buildSelector(el))).toBe(el);
  });

  it('caps the climb at five segments', () => {
    render('<div><div><div><div><div><div><div><span>deep</span></div></div></div></div></div></div></div>');
    const el = document.querySelector('span')!;

    expect(buildSelector(el).split(' > ')).toHaveLength(5);
  });

  it('escapes ids that are not bare identifiers', () => {
    render('<div id="a.b:c">x</div>');
    const el = document.querySelector('div')!;

    const selector = buildSelector(el);
    expect(selector).toBe('#a\\.b\\:c');
    expect(document.querySelector(selector)).toBe(el);
  });

  it('falls back to the tag name for a detached element', () => {
    const el = document.createElement('button');

    expect(buildSelector(el)).toBe('button');
  });
});
