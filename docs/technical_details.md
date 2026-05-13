# Technical Details

## Data save location

Most data is currently saved in [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
(preferences are saved in [storage.sync](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync)).
This is done due to ease of use: localStorage is easy to access, saves
data in the JSON format, and is deleted automatically by the browser
when a private session ends or a user clears their site data, something that
[does not happen for extension storage methods](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage#:~:text=Firefox,scenarios,-%2E). Additionally,
localStorage is per-domain ([technically per-origin](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API#:~:text=localStorage%20is%20partitioned%20by%20origin%20only%2E)),
while [the extension-focused storage methods store data globally](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage#:~:text=Values%20are%20scoped%20to%20the%20extension%2C%20not%20to%20a%20specific%20domain).
This gives localStorage more storage space than the extension storage methods (see
next paragraph).

The downside of using localStorage is that it has a fairly limited storage capacity:
[storage is generally limited to around 5MiB](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage).
However, assuming that localStorage usage for a site isn't otherwise much,
by basic estimates the extension should be still able to store the data for a
thousand or more URLs of loop data per site. Regardless, if the limit is shown
to be more easily reached, a switch could be made to [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API),
which has [much higher storage limits](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#other_web_technologies)
compared to localStorage. IndexedDB likewise has [automatic wiping of data](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology#:~:text=browsers%20can%20wipe%20out%20the%20database%2C%20such%20as%20in%20the%20following%20conditions)
in private sessions and when data is wiped by the user, and is [per-origin](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology#:~:text=IndexedDB%20adheres%20to%20a%20same%2Dorigin%20policy%2E)
like localStorage (which is admittedly less important due to the much higher
storage limits, and could even be a hindrance). Currently, there are no plans to make this move, as localStorage
should likely be enough in most cases and switching to IndexedDB would potentially
be a lot of work.