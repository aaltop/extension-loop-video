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

- Created [loops can be browsed](./docs/manual.md#domain-data). [Loops can be given titles, descriptions,
and tags](./docs/manual.md#metadata), and the list of created loops can be filtered based on these
details. The list has links associated with each loop, allowing for
quick access to the page the loop was created for.

See more details in [the manual](./docs/manual.md), and check out [the basic usage examples](./docs/usage.md).

## Important

Data is currently saved in localStorage, which could be wiped or run out of space.
[Backup your data](./docs/manual.md#controls) if you're worried about losing it! See [the technical details](./docs/technical_details.md#data-save-location)
for more information.


# Development

For development, the following tools are needed:

- [node](https://nodejs.org/en) (version ^24.13.1)
- [pnpm](https://pnpm.io/) (version ^11.1.3)
- A browser binary, for example [Firefox Developer Edition](https://www.firefox.com/en-US/channel/desktop/developer/).

The following tools are optional, but may be useful:

- [python](https://www.python.org/) (version ^3.12.3)
    - Used for scripting in some places
- [docker](https://www.docker.com/get-started/)
    - Can be used to build the extension without the need for installing
    other tools
    - [docker engine](https://docs.docker.com/engine/) (version ^29.1.5)

In the above, versioning is the recommended versioning, but other versions
may also work.

Development has been carried out on Linux (Ubuntu 24.04 LTS). Development
requirements on other platforms may differ.

## Developing

1. Install packages:
```sh
pnpm install
```

2. Create the file `_config.ts` in the root directory, and export a value
BINARY_FIREFOX from there:
```typescript
// replace <path/to/firefox/binary> with the path to your firefox binary
export const BINARY_FIREFOX = "<path/to/firefox/binary>"
```

It is recommended that this be a [development version](https://www.firefox.com/en-US/channel/desktop/developer/)
of the browser. The supplied binary will be used as the development browser;
see [wxt.config.ts](./wxt.config.ts).




## Building