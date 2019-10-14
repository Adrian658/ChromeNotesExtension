/*
 * Notes.js -> The main javascript file containing our implementation of Notes, Library, and important functions.
 */
function print(str){
    chrome.extension.getBackgroundPage().console.log(str);
}

print("starting notes.js");
//test();

/*
 * Class: Notes
 * Objective: Contains the constructor for a note, as well as the ability to update the note and filter it by hashtags.
 */
class Notes {

    constructor(id, title, text, color) {
        this.id = id;
        this.title = title;
        this.text = text;
        this.color = color;
    }

    update(title,text,color){
        this.title = title;
        this.text = text;
        this.color = color;
    }

    filter(hashtags){
        //todo, return boolean
    }
}

/*
 * Class: Library
 * Objective: Contains the constructor for a library, as well as 
 *            methods to allow creation, deletion, updating, searching, and retrieval of notes.
 */
class Library {

    constructor() {
        this.idCounter = 1;
        this.notes = [];
    }

    binarySearch(id){
        //binary search this.notes, return array index
    }

    createNote(title,text,color){
        //assign id based on this object's id counter
        //append new object to array
        this.idCounter+=1;
    }
    editNote(id,title,text,color){
        //binary search id => index
        //edit node object in array with corresponding index
    }
    deleteNote(id){
        //binary search id => index
        //delete from array based on index
    }
    getNotes(){
        //add filter later
        return this.notes;
    }
}

/*
 * A function that gets a library or creates a new one if there was not one found.
 */
async function getLib(){
    var lib = null;
    console.log("Retrieveing the current library...");
    chrome.storage.sync.get({'lib': lib}, function(currentLib){
        lib = currentLib.lib;
    });
    if(lib==null){
        console.log("No library was found. A new library is being created...");
        lib = new Library();
        chrome.storage.sync.set({'lib': lib}, function(){
            console.log("Library successfully created.");
        });
    } else {
        console.log("A library was found. ");
        console.log(lib.notes.length + " notes in library.");
    }
    //grab Library object when script starts
    //if not found(ie. first time using app on this machine), create new library object and save
    //lib = localStorage["lib"]
    return lib;
}

async function saveLib(lib){
    chrome.storage.sync.set({'lib': lib}, function(){
            console.log("Library successfully created.");
    });
    return;
}

/*
 * Functions for the library object. Allows for creation, deletion, editing, and retrieval of notes.
 */
function getNotes(){
    var lib = await getLib();
    return lib.getNotes();
}
function editNote(id,title,text,color){
    var lib = await getLib();
    lib.editNote(id,title,text,color);
    saveLib(lib);
}
function createNote(title,text,color){
    var lib = await getLib();
    lib.createNote(title,text,color);
    saveLib(lib);
}
function deleteNote(id){
    var lib = await getLib();
    lib.deleteNote(id);
    saveLib(lib);
}

//Test function for the chrome storage API.
var num = null;
function test(){
    chrome.storage.sync.get({'num':0},function(data){
        num = data.num;
        num+=1;
        print("num = " + num);
        chrome.storage.sync.set({'num':num},function(){
            print("Saved num to sync'd storage");
        });
    });
}

