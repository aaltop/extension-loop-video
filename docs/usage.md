# Usage

## Creating a loop

1. Go to the website where you wish to loop a video and find the video
you wish to loop.

2. Open the extension sidebar. Consult your browser's documentation
to figure out how to do this.

3. In [the controls section](manual.md#controls), use the video select
and highlight controls to find the video. Sites may have multiple
videos on a page, even when it does not look like it.
By actively playing the video you want to loop,
it should be easier to select the video as the select
shows the playing status of each video. Use the highlight button to
verify that the correct video is selected.

4. Use the controls of the video itself to find the start time for a section
you wish to create. Once you've found the start time, back in the extension
press **Set as current video time** in [the sections table](manual.md#sections-table)
in the **Start Time** column. The input below the button should update to show
the current video time in seconds, assuming that a video with a non-zero time
is currently selected. To set the end of the section, find that point again
in the video, and do the same as above in the extension, but in the **End Time**
column instead. The end time should be greater than the start time.

    During this process at any point, you may wish to **Save State** in [the controls](manual.md#controls).

5. If you wish to add more sections, press the **Add Section** button above
[the sections table](./manual.md#sections-table), which creates another
row in the sections table. For the new row, repeat the steps outlined in step 4.
A subsequent section should come after the section that preceeds it. That is,
a section of a lower row should have a start time greater than the end times
of each row that comes before it, and all sections should have start times that
are less than their end times; simply put, sections should be in order.

6. Once the sections have been created, looping can be started by pressing
**Enable Looping** in [the controls](./manual.md#controls).

It is also possible to change the sections &mdash; disable/enable them or set the start and end time &mdash;
while looping is active, and the loop should automatically update.
This may make it easier to fine-tune sections.

Note that looping isn't picosecond perfect and depends generally on the load of
the system, so creating a smooth loop of a song that's perfectly in sync with the beat
is probably not doable. Looping in the extension is meant for slightly more 
coarse situations. See [the technical details](./technical_details.md#looping-accuracy) for more.