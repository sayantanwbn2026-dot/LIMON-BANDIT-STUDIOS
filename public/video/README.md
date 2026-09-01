# Drop the film here

`RoomFilm` (src/components/sections/RoomFilm.tsx) plays `room-a.mp4` from
this folder. There is no video committed to the repo, so until a file
lands here the section shows its poster frame — the scroll-opening, the
controls and the layout are identical either way.

To make it play, add:

    public/video/room-a.mp4

Encode it muted-friendly and small: the section autoplays it on arrival,
so it should be short, looping, and no larger than a few MB. H.264 in MP4
covers every browser this site targets; add a `.webm` beside it and a
second <source> if you want the smaller file for Chrome and Firefox.
