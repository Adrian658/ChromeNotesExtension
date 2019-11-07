# ChromeNotesExtension

Steps to test our project:
1. Clone/Download our project from github
2. Navigate to manage extensions in Chrome settings
3. Switch the developer mode switch on
4. Click 'load unpacked' and select the folder of our project
5. Click the little c in the upper right of the browser to open the extension

# Tagging Notes
You can tag a note by adding # immediately followed by a tag phrase anywhere within the note body.
This will assign that tag to the note.  
You can then:
- view tags across all notes
- filter notes by tag name
- search for notes by tags they contain

# Storage
Notes are stored using Chrome Sync Storage, meaning they are associated with the account you are logged in as.
If you're not logged in, notes are stored on the machine you are currently using.

# Searching
Search criteria input into the search bar can search through notes in two different ways
- If only normal text is entered: notes with titles that contain the search criteria will be returned
- If the search criteria begins with a #: notes that contain hashes matching the search criteria will be returned

# Saving
Notes are saved automatically
- 1.5 seconds after the last change is made to the editor
- When a new note is opened