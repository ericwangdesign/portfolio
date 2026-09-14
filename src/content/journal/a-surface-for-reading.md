---
title: A surface for reading
date: 2026-09-12
kind: site note
standfirst: Before there is anything to read there has to be somewhere to read it. This is the page the writing gets set on, and the reasons behind each number in it.
published: true
---

Every time I've started a blog I've started with the writing, and every time the
writing has arrived on a page I hadn't decided anything about. So this is the
other order. The surface first, settled, argued with — then the pieces.

The whole thing is three decisions: how wide the line is, what the hierarchy is
made of, and where the reader is told they are. Everything else follows from
those.

## The measure

A line of text has a length past which the eye loses the return. The number
usually quoted is 45 to 75 characters; the useful half of that range for a screen
you lean back from is nearer the top.

This column is **620px wide, set at 17px**, which runs about 68 characters of
Geist. The homepage column is 640px at 14px — the same block of space, holding
about a third fewer words per line, because a list of projects is scanned and an
argument is read.[^measure]

<figure class="wide plate">
<svg viewBox="0 0 880 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram of the page: a 188px rail, 72px of gutter, and a 620px reading column.">
  <g fill="none" stroke="#4e4e4e" stroke-width="1">
    <rect x="40" y="40" width="150" height="180" rx="3" />
    <rect x="310" y="40" width="530" height="180" rx="3" />
  </g>
  <g fill="#8a8a8a" font-family="ui-monospace, Menlo, monospace" font-size="11">
    <text x="40" y="30">rail · 188</text>
    <text x="205" y="30">gutter · 72</text>
    <text x="310" y="30">measure · 620</text>
  </g>
  <g stroke="#3a3a3a" stroke-width="1" stroke-dasharray="3 3">
    <line x1="190" y1="40" x2="190" y2="220" />
    <line x1="310" y1="40" x2="310" y2="220" />
  </g>
  <g fill="#5e5e5e">
    <rect x="56" y="60" width="90" height="4" rx="2" />
    <rect x="56" y="96" width="64" height="3" rx="1.5" />
    <rect x="56" y="112" width="78" height="3" rx="1.5" />
    <rect x="56" y="128" width="58" height="3" rx="1.5" />
  </g>
  <g fill="#e6e6e6">
    <rect x="330" y="58" width="300" height="10" rx="3" />
  </g>
  <g fill="#6e6e6e">
    <rect x="330" y="92" width="490" height="4" rx="2" />
    <rect x="330" y="108" width="490" height="4" rx="2" />
    <rect x="330" y="124" width="490" height="4" rx="2" />
    <rect x="330" y="140" width="418" height="4" rx="2" />
    <rect x="330" y="172" width="490" height="4" rx="2" />
    <rect x="330" y="188" width="356" height="4" rx="2" />
  </g>
</svg>
<figcaption><strong>The page.</strong> The column is centred in the window and the rail hangs off its left edge, so the writing keeps the middle of the screen on any monitor. Centring the pair together would push the text to the right of where the eye expects it.</figcaption>
</figure>

## What the hierarchy is made of

There is one typeface on this site, and the web font ships weights 400 to 500
only. So there is no bold to reach for. That started as a constraint and turned
out to be the rule worth keeping: **hierarchy comes from size and from ink, not
from family or weight.**

Which leaves four levels and no more:

1. The title, at 42px, tracked tight, in full white.
2. A section head at 23px, also white — the only other white thing on the page.
3. A turn inside a section at body size, one step down the grey.
4. The writing itself at 17px in `#cccccc`.

Body text sits below white deliberately. Pure white on `#0f0f0f` at reading
length glares; a step down holds the contrast well past the accessibility floor
and stops the page buzzing after two screens.

### Space belongs to the break

Headings carry their margin *above* and almost none below. The gap is the break
in the argument, not decoration around a label, and a heading should sit close to
the thing it names. A 72px gap above a section head and 18px below reads as one
break; 40px on both sides reads as two weak ones.

> The rule I keep coming back to: if you can't tell what a piece of space is
> doing, it isn't doing anything.

## Where you are

The rail does two things and refuses a third. It lists the sections of this piece
and marks the one you're reading under, and it lists the other pieces. It does
not carry a search box, a newsletter, a theme switch, or a progress bar.

The current section is marked with a hairline in the gutter rather than a colour
or weight change, so the list stays one colour and one size and the eye still
lands on the right row.

Tracking is done against a **reading line** a third of the way down the window —
the last heading whose top has passed that line wins:

```js
var line = window.innerHeight * 0.3;
var found = heads[0];
for (var i = 0; i < heads.length; i++) {
  if (heads[i].el.getBoundingClientRect().top <= line) found = heads[i];
}
```

An `IntersectionObserver` is the usual answer and it gets short sections wrong —
two headings in view at once and it picks by entry order, which flickers on the
way back up.

---

## Figures

Three widths, and picking between them is a judgement about the content rather
than about the layout.

**In the column** for anything you read left to right like a sentence — a
screenshot of a single control, a photograph.

**A step wider** for anything with structure in it. A diagram squeezed to the
measure has to be squinted at, and a diagram that has to be squinted at isn't
worth the words it replaced. The one above is this width.

**Edge to edge** for something that should interrupt — a map, a full frame, a
piece you're meant to fall into rather than inspect.

Anything with a transparent background sits on a plate, or it floats loose on the
ground with nothing to hold its edges.[^plate]

## What isn't settled

The thing I'd argue with first is the typeface. Geist is a good interface face
and this is not an interface. A text face for the body only — everything else
staying Geist — is the version of this page I haven't built yet, and the only way
to judge it is to set two thousand real words in both and read them a day apart.

[^measure]: Bringhurst gives 66 characters as the single best line length for a
serif book face and 45–75 as the working range. Screens want the shorter end of
that, being read further away and at lower contrast than paper.

[^plate]: Which is also why figure captions sit at 13px in the same grey as the
rail: a caption is an instrument reading, not part of the argument.
