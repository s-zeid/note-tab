Note Tab
========

A simple ES6 webapp to write a note in a tab.  
<https://note-tab.bnay.me/>  
<https://code.s.zeid.me/note-tab>

*                        *                        *                        *

Contents
--------

* [Features](#features)
* [Usage](#usage)
* [File Format](#file-format)
* [License and Privacy](#license-and-privacy)


Features
--------

* Simple UI that adapts to your system colors when possible (in Firefox for now).
* Perfect for use with [Tree Style Tab](https://addons.mozilla.org/firefox/addon/tree-style-tab/)!
* Each note is a separate tab/window.
* Each note can have a title and body text.
* Each note is stored in the tab's location bar when saved.
* Each note is stored in the tab's history state as you edit it.
  This allows unsaved notes to be restored when you restart your browser.
* Your notes stay on your device
  (unless your browser is set up to synchronize your browsing history).
* You can customize the "New note" text by changing the `type=` parameter
  in the URL.
* You can copy a permalink to a note whether or not it has been saved.
* Notes can be saved to and loaded from text files.
* Notes can be printed through your browser's built-in print function.


Usage
-----

A recent version of a modern web browser is required.
[Firefox](https://www.mozilla.org/firefox/) is recommended.

Simply go to <https://note-tab.bnay.me/>.  To save a note to the location bar,
either click on `#` at the top-right or press Ctrl+Enter/Command+Enter.  (If
the note's title is focused, you can simply press Enter.)

You can also clone the Git repository and run the app locally.  However, that
requires you to use a local Web server instead of the file: URL scheme.


File Format
-----------

A simple plain text format is used for saving and loading notes.
The file extension used is `.txt`.

The title, if not empty, is saved to the beginning of the file using
Markdown Setext-style heading syntax, e.g.:

```
Title
=====

Body
...
```

The note type (`type=...` in the hash) is saved to the end of the filename,
before the file extension, e.g. `Title.type.txt`.

When loading a file, the title is always loaded from the file's contents.
If the file does not contain a title in the format shown above, then the
title used will be the empty string.  The type is loaded from the filename
using the format shown above if the following rules are all true.  If
they are not true, then the default type ("note") is used.

* The filename ends in ".txt",
* `type` only contains letters, spaces, and/or code points above U+007F
  (e.g. accented letters or non-Latin scripts), and optionally
  a " (`digit(s)`)" or "-`digit(s)`" suffix (sometimes added by browsers
  or file managers when a file with the same name already exists),
  and
* `type` does not start with a space.

An " (`digit(s)`)" or "-`digit(s)`" suffix is stripped from the type.

A leading dot in the filename is not considered to be the separator
between the title and `type`.  (These are hidden files in most operating
systems other than Windows.)

These rules are meant for cases where a file not made by this app
(or one that has been renamed) is opened and contains numbers or
periods in its filename (e.g. the name contains multiple sentences
or contains prefixes such as "Ms. "), without requiring an extra
identifying suffix such as ".tab" to be added to the filename or
clutter to be added to the file's contents.

[The HTML Living Standard][html-textarea-api-value] states that newlines
are to be normalized to Unix line endings (i.e. `\n` instead of `\r\n`).
Firefox and Chrome both do this on Windows (IE and pre-Chromium Edge are
not supported).  Therefore, the files will use Unix line endings.

[html-textarea-api-value]: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#textFieldSelection


License and Privacy
-------------------

This program is [free software](https://www.gnu.org/philosophy/free-sw.html)
released under the X11 License.  [Its source code may be found on
GitLab.](https://code.s.zeid.me/note-tab)  All data is processed on your own
device (i.e. not sent anywhere) and no tracking or analytics scripts are used.

If you are not using private browsing, then your notes will be stored in your
browser history
(a) as you type, using [the HTML5 History API](https://developer.mozilla.org/docs/Web/API/History_API),
and (b) in the URL's hash (the part after the `#` symbol) when you save a
note.  This obviously places your notes at the mercy of your browser's
privacy practices.  Firefox will also store the individual form fields
for each tab (but Note Tab does not rely on that behavior).

**DISCLAIMER**:
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
