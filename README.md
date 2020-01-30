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
* You can save a note as a text file.


Usage
-----

A recent version of a modern web browser is required.
[Firefox](https://www.mozilla.org/firefox/) is recommended.

Simply go to <https://note-tab.bnay.me/>.  To save a note to the location bar,
either click on `#` at the top-right or press Ctrl+Enter/Command+Enter.  (If
the note's title is focused, you can simply press Enter.)

You can also clone the Git repository and run the app locally.  However, that
requires you to use a local Web server instead of the file: URL scheme.


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
for each tab.

**DISCLAIMER**:
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
