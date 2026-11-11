# KazChart scene JSON reference

```json
{
  "preset": "abyss | ink",
  "width": 1920, "height": 1080, "fps": 30,
  "grain": 0.05,
  "tokens": { "hl": "#f5a623" },
  "audio": "vo.mp3", "music": "bed.mp3", "musicVolume": 0.18,
  "shots": [ { "start": 0, "end": 4, "bg": {}, "camera": {}, "fadeIn": 0.5, "fadeOut": 0, "vignette": 0.75, "elements": [] } ]
}
```
All coordinates are in a 1920x1080 world, whatever the output size. Element times (`t0`, `t1`, `check`, `t`) are **seconds from the start of the shot**. Most elements accept `t0` (appear), `t1` (disappear) and `fade`.

## Shot `bg`
| field | meaning |
|---|---|
| depth | 0 = sunlit teal → 1 = near-black abyss (default 0.4) |
| rays | god rays on/off (default on when depth < .75); `rayOpacity` |
| sun | `{x,y,r}` bright backlight disc (pairs well with silhouettes) |
| spotlight | `{x,w}` light cone from the top onto a hero object |
| seabed | `"sand"` or `"dark"`; `seabedY` |
| surface | true = bright surface band at the top |
| particles | false to disable marine snow; `particleCount` |
| mode | `sonar`, `thermal`, `black`, `paper` |
| top / bottom | override the gradient colours |

## Shot `camera`
`zoomFrom`, `zoomTo`, `x`, `y` (focus point), `panX`, `panY`. These ease across the whole shot and apply to the world layer only.

## Elements
| type | key fields |
|---|---|
| creature | `kind`: whale, shark, orca, squid, fish, diver, person, sharkFront, blob · `x,y,scale,rotate,flip` · `mode`: silhouette, thermal, sonar, ghost · `swim:{vx,vy}` px/s · `bob` · `phase` · `approach:{from,to,dur,t0}` · `moveTo:{x,y,dur,t0}` · `threat` (red eyes) · `dim` · `opacity` |
| school | creature fields plus `count,w,h,seed` (random spread) |
| caption | `text` (use `*kw*` highlight and `!kw!` red) · `pos`: bottom, top, center or `x,y` · `size` · `caps` · `underline` |
| pill | `text,x,y` · `check` · `tone:"red"` · `size,w` |
| factstack | `x,y,w,gap,size` · `items:[{text,t0,tone}]` |
| stamp | `text,x,y,color,rotate,size` |
| circle | `x,y,rx,ry,color,width,dur,seed` (hand-drawn marker, draws on) |
| redx | `x,y,size,color` |
| tag | `text,x,y,size,box` (corner label, underlined) |
| reticle | `x,y,r` (zoom target ring) |
| meter | `x,y,w,value(0-1),number,unit,sub,title,dur` |
| isotype | `x,y,cols,count,cell,rowH,dur,label,legend,lostFrom,lostT` · `counter:{from,to,prefix,round,sub,color}` |
| sonar | `x,y,r,spread,speed` · `blips:[{x,y,label,t}]` (pair with sonar-mode creatures) |
| gridlines | `lines:[{y,label}]` (height chart) |
| namecard | `title,sub,x,y,w` |
| doccard | `x,y,w,h,header,title (\n allowed),footer,rotate` |
| checklist | `x,y,w,title` · `items:[{text,check}]` |
| bignumber | `from,to,prefix,suffix,x,y,size,color,dur` |
| bracket | `x1,y1,x2,y2,label,color` (measurement) |
| marker | `x,y,n` (yellow evidence marker) |
| tooth | `x,y,scale,cusps` (fossil hero object) |
| rect / svg | escape hatches: a raw rectangle, or raw SVG `markup` |

`layer: "world" | "overlay"` overrides where an element is drawn. Creatures, schools, teeth and markers default to world (they move with the camera); everything else defaults to overlay.
