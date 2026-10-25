# Drop the films here

## The label's music videos

The label page's "Three to watch" cards play files from this folder through
the theatre player (src/components/label/VideoTheater.tsx). Which films are
featured, and where each one's files live, is set in the admin under
**Label → Music videos** — tick "Feature" on up to three.

Each film can have up to three encodes of the same cut. The player offers
whichever exist and starts on the one the visitor's screen can use:

| Admin field       | Size      | Suggested name         |
| ----------------- | --------- | ---------------------- |
| 4K file (2160p)   | 3840×2160 | `rusted-gold-2160.mp4` |
| HD file (1080p)   | 1920×1080 | `rusted-gold-1080.mp4` |
| Light file (720p) | 1280×720  | `rusted-gold-720.mp4`  |

Encode H.264 (High profile, level 5.1 for 4K) with AAC audio in MP4 and
`-movflags +faststart`, so playback starts before the whole file arrives.
For anything longer than a minute or two, host the files elsewhere (a CDN,
a storage bucket) and put the links in the admin instead — or paste a
YouTube or Vimeo link, which plays in their own player at up to 4K.

`rusted-gold-2160.mp4`, `terminus-2160.mp4` and `park-circus-2160.mp4` are
**placeholders** — a slow camera move over each release's artwork, cut to
the placeholder audio — made by `bun run films` (scripts/films.mjs, needs
ffmpeg). Replace them with the real films under the same names, or point the
admin at the real ones, then delete the script.

## The Room A film

`RoomFilm` (src/components/sections/RoomFilm.tsx) plays `room-a.mp4` from
this folder. There is no video committed for it, so until a file lands here
the section shows its poster frame — the scroll-opening, the controls and the
layout are identical either way.

To make it play, add:

    public/video/room-a.mp4

Encode it muted-friendly and small: the section autoplays it on arrival,
so it should be short, looping, and no larger than a few MB. H.264 in MP4
covers every browser this site targets; add a `.webm` beside it and a
second <source> if you want the smaller file for Chrome and Firefox.
