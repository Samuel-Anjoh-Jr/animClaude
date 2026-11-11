# Storyboard schema (render.py)

```json
{ "title": "...", "scenes": [ { scene }, ... ] }
```
Coordinates are in a 1280×720 design space (floor at y=560), whatever the output resolution.

## Scene fields
| field | type | meaning |
|---|---|---|
| `duration` | sec | required |
| `set` | string | `bedroom` `couch` `desk` `mirror` `gym` `city` `stairs` `hill` `street_rain` `clock_closeup` `spotlight` `empty` `black` `title` `graph` |
| `palette` | string | `night` `cold` `dawn` `sunset` `warm` `day` `rain` `home` `black` |
| `day` / `day_big` | string / bool | day label; big = centred "DAY 1." style |
| `caption`, `caption_pos` | string, `top`/`bottom`/`center` | narrator text |
| `whisper`, `whisper_xy`, `whisper_size` | | red typewriter text (defaults to above the shadow) |
| `hero` | object or list | see below |
| `shadow` | object | `x`, `to_x`, `scale` (1.25), `behind` (true), `eyes` (true), `ground` |
| `meter` | object | `label`, `from`, `to` (0–100) |
| `bubble` | object | `text`, `x`, `y` (tail points down at x,y) |
| `props` | list | `{type: window|clock|desk|couch|mirror|bag|sign, x, y, text, sky, cracked}` |
| `clock`, `alarm` | string, bool | clock digits on bedroom/clock_closeup; alarm = ringing lines + beeps |
| `sky` | `night`/`dawn`/`sunset`/`day` | bedroom window |
| `cracked` | bool | mirror set |
| `big_text` | string | huge centred white text (counts like "1", "3") |
| `rain`, `sparks`, `flash`, `grain` | bool | effects |
| `zoom`, `focus` | number or [from,to], [x,y] | camera push-in |
| `fade_in`, `fade_out` | sec | default 0.35 |
| `music` | `dark` `tense` `warm` `hope` `silent` | score mood for this scene |
| `sfx` | list | `"alarm"` or `{name: hit|boom|whoosh|alarm, at: sec}` |
| `title`, `sub`, `punch` | | for `set: title` |
| `goal`, `a`, `b` | | labels for `set: graph` |

## Hero fields
Figure style: pictogram build (round head with face, rounded-shoulder torso, thick round-ended limbs).
`x`, `to_x` (walks between), `pose` (`stand` `walk` `run` `lean` `sit` `slump` `lie` `curl` `pushup` `punch` `talk`),
`arms` (`down` `crossed` `hips` `head` `scratch` `pockets` `point` `raise` `punch` `phone`; standing poses — see examples/pose-gallery.json),
`mood` (`neutral` `happy` `sad` `tired` `angry` `determined` `scared` `sleep`), `scale` (1.3), `headband`, `phone` (blue face glow),
`look` (-1..1 eye direction), `aura` ([r,g,b] glow), `on_stairs` (follow the stair steps), `ground` (y), `color` ([r,g,b], for side characters), `ease` (false = linear walk).

`lie` pose: put the hero's `x` on the pillow (bed_x + 20) — the blanket is drawn over the body automatically.

## Extending
New set = one function in `render.py` + an `elif` in `render_frame`. New pose = one branch in `hero()`.
