# Manual

## Menu bar

The menu bar has two dropdowns:

- Menu (Intended contents: any generic controls for the extension.)
    - Reset state
        - Resets the looping data. Does not clear any saved data or similar,
        just resets the currently set contents of [the sections table](#sections-table).
    - Upgrade data version
        - If the schema of the saved data is changed at some point, this
        will allow upgrading that schema.
- Preferences (Intended contents: preferences like decreased animations)
    - Confirm Actions
        - Allows toggling of confirms on given actions, currently saving
        and loading of state. Other high-consequence actions that are expected
        to be used less often will have confirms regardless.

## Metadata

The metadata section is used for setting the metadata (title, description,
tags) of loop data. For setting new tags, if any tags are set in other
loop data of the current domain, those tags can be brought up as suggestions.
This happens when something is written in the input, in which case suggestions
are brought up based on the written content. Otherwise the suggestions can be
brought up with a double click or with <kbd>CTRL</kbd> + <kbd>DOWN ARROW</kbd>.
This may be browser-dependent.

## Sections Table

The sections table allows creating the time sections for the loop. A section
is a delimited part with a start and end time in the video. Looping happens only
within the sections: if the current time is within one of the sections, playing
of the video continues normally. If the time is between sections, it jumps to the
start of the next section, naturally with loopback to the first section. There are
three columns in the sections table:

- Disable/Enable
    - Allows disabling/enabling a given section. When a section is disabled,
    that part will not be considered in the looping. In particular, disabling a
    section removes that section from the consideration of the looping as
    if that section was not in the sections table at all.
- Start Time
    - Allows setting the start time of the video.

The sections are expected to be in order, i.e. Section 1 should not have a
start time that is after any part of Section 2. In general, if sections
are in the wrong order or overlap, the resulting looping behaviour is undefined.

## Controls


## Sections table