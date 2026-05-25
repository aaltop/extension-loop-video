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

See more details in [the manual](manual.md), and check out [the basic usage examples](usage.md).

## Important

Data is currently saved in localStorage, which could be wiped or run out of space.
[Backup your data](manual.md#controls) if you're worried about losing it! See [the technical details](technical_details.md#data-save-location)
for more information.


# Development

## Requirements

For development, the following tools are needed (unless just building using Docker; see further below):

- [node](https://nodejs.org/en) (version ^24.13.1)
    - Download: https://nodejs.org/en/download
- [pnpm](https://pnpm.io/) (version ^11.1.3)
    - Download: https://pnpm.io/installation
- A browser binary, for example [Firefox Developer Edition](https://www.firefox.com/en-US/channel/desktop/developer/).

The following tools are optional, but may be useful:

- [python](https://www.python.org/) (version ^3.12.3)
    - Used for scripting in some places
    - Download: https://www.python.org/downloads/
- [docker](https://www.docker.com/get-started/)
    - Can be used to build the extension without the need for installing
    other tools
    - [docker engine](https://docs.docker.com/engine/) (version ^29.1.5)
        - Download: https://docs.docker.com/engine/install

In the above, versioning is the recommended versioning, but other versions
may also work.

Development has been carried out on Linux (Ubuntu 24.04.4 LTS). Development
requirements on other platforms may differ.

## Developing

1. Create the file `_config.ts` (see [the example file](https://www.github.com/aaltop/extension-loop-video/blob/main/_config.example.ts)) in the root directory, and export the values
`BINARY_FIREFOX` and `BINARY_CHROME` from there:
    ```typescript
    // replace <path/to/firefox/binary> with the path to your firefox binary
    export const BINARY_FIREFOX = "<path/to/firefox/binary>"
    // do the same as above but for chrome
    export const BINARY_CHROME = "<path/to/chrome/binary>"
    ```

    The string can be left empty (or any string value) if development isn't being
    done using that browser.

    It is recommended that the firefox binary be a [development version](https://www.firefox.com/en-US/channel/desktop/developer/)
    of the browser. The supplied binary will be used as the development browser;
    see [wxt.config.ts](https://www.github.com/aaltop/extension-loop-video/blob/main/wxt.config.ts).

2. Install packages:
    ```sh
    pnpm install
    ```

3. Use the appropriate dev command to start hot-reload development. For Firefox:
    ```sh
    pnpm dev:firefox --mv3
    ```
    and for Chrome:
    ```sh
    pnpm dev --mv3
    ```

    the flag `--mv3` specifies that [Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
    is to be used. See [the package.json scripts section](https://www.github.com/aaltop/extension-loop-video/blob/main/package.json) for more details about the commands.

    These commands open up the appropriate browser specified in step 1 with the
    extension loaded, and will hot-reload the extension.

## Building

The easiest way to build the extension is using Docker (see [the requirements](#requirements)).
From the root of the directory,
```sh
sh ./docker/build.sh
```
will build the extension and output the build artifacts to `.output/`; If `sh`
is not available, see [the executed script file](https://www.github.com/aaltop/extension-loop-video/blob/main/docker/build.sh) for the commands
or use another suitable shell. This will create the zipped build artifacts: a
Firefox-suitable extension, a Chrome-suitable extension, and the source code.
Building like this should only require Docker.

To build the extension more manually, The [Dockerfile](https://www.github.com/aaltop/extension-loop-video/blob/main/docker/build.Dockerfile)
itself shows the steps needed to do that, but in short, replacing step 3 in
[the 'developing' section](#developing) with
```sh
pnpm zip:firefox --mv3
```
or for Chrome,
```sh
pnpm zip --mv3
```
should do the job. These command will build the extension for the particular
browser and output the zipped extension contents to `.output/`. See also
[build.sh](https://www.github.com/aaltop/extension-loop-video/blob/main/build.sh) in the root.