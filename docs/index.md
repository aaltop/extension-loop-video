# Loop Video

**Loop video** is a browser extension that allows dividing a video into sections
and looping through these sections. Created loops can be saved.
Intended to work on any HTML videos, i.e. across all sites.

## Description

If you've ever used the looping ability on Youtube but felt like it's a little
too simple in some cases, this extension was designed with that in mind.
You'd like to have the video play over and over, but want to skip those ads
at the start, middle, and end of the video. **Loop Video**
allows creating sections for the video: You can start a section just
after the first ad ends and end the section at the start of the midroll ad,
creating another section starting after the midroll and ending just
before the ad at the end. Now, you can start the looping, and only the sections
will play such that the ads are skipped.

Key features of **Loop Video**:

- Designed to work with any video, so should be usable on any site that uses the [HTML video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) for its video capabilities.

- Loop data can be saved per-URL so loops can be created for multiple
pages and loaded back between browser sessions. Private session data is always
deleted. Data can also be saved to and loaded from file, allowing making backups
or sharing loops etc.

- Created [loops can be browsed](manual.md#domain-data). [Loops can be given titles, descriptions,
and tags](manual.md#metadata), and the list of created loops can be filtered based on these
details. The list has links associated with each loop, allowing for
quick access to the page the loop was created for.

See more details in [the manual](manual.md).

## Important

Data is currently saved in localStorage, which could be wiped or run out of space.
[Backup your data](manual.md#controls) if you're worried about losing it! See [the technical details](technical_details.md#data-save-location)
for more information.