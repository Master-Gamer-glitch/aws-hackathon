import { Container, Graphics, Text } from 'pixi.js';
import type { RoomSign } from './themeRegistry';

// Room nameplates — real scene objects (Graphics + Text), not part of any image.
// Cream plate, dark outline, a thin green inset frame; big title over a small subtitle.
// Text is rasterised at a high resolution so it stays crisp when the camera zooms.

const INK = 0x2a2233;
const INK_SOFT = 0x5b5468;
const PLATE = 0xf6efdc;
const OUTLINE = 0x1d1826;
const TRIM = 0x5f8a6a;

const TITLE_SIZE = 10;
const SUB_SIZE = 7;
const PAD_X = 6;
const HEIGHT = 26;

export function buildRoomSign(sign: RoomSign, tileSize: number): Container {
  const root = new Container();
  root.label = `sign:${sign.id}`;
  root.eventMode = 'none';

  const title = new Text({
    text: sign.title,
    style: { fontFamily: 'monospace', fontSize: TITLE_SIZE, fontWeight: 'bold', fill: INK, letterSpacing: 0.4 },
    resolution: 6,
  });
  const sub = new Text({
    text: sign.subtitle,
    style: { fontFamily: 'monospace', fontSize: SUB_SIZE, fontWeight: 'bold', fill: INK_SOFT, letterSpacing: 0.2 },
    resolution: 6,
  });
  title.anchor.set(0.5, 0);
  sub.anchor.set(0.5, 0);

  const w = Math.ceil(Math.max(title.width, sub.width) + PAD_X * 2);
  const g = new Graphics();
  g.roundRect(0, 1, w, HEIGHT, 2).fill(OUTLINE);             // drop shadow / outline
  g.roundRect(0, 0, w, HEIGHT, 2).fill(OUTLINE);
  g.roundRect(1, 1, w - 2, HEIGHT - 2, 1.5).fill(PLATE);
  g.roundRect(2, 2, w - 4, HEIGHT - 4, 1).stroke({ color: TRIM, width: 0.75, alpha: 0.85 });

  title.position.set(w / 2, 3);
  sub.position.set(w / 2, 3 + TITLE_SIZE + 1.5);

  root.addChild(g, title, sub);
  root.position.set(Math.round(sign.x * tileSize - w / 2), Math.round(sign.y * tileSize));
  // sits with the wall it hangs on: characters walking in front of it draw over it
  root.zIndex = Math.round(sign.y * tileSize) + HEIGHT;
  return root;
}
