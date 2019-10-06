/*
 * Class: Notes
 * 
 */
function print(str){
    chrome.extension.getBackgroundPage().console.log(str);
}

print("starting notes.js");
test();

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
var lib = null;
function getLib(){
    console.log("getting lib");
    if(lib==null){
        console.log("no lib found, creating one");
        lib = new Library();
    } else {
        console.log("lib found");
        console.log(lib.notes.length+" notes in library");
    }
    //grab Library object when script starts
    //if not found(ie. first time using app on this machine), create new library object and save
    //lib = localStorage["lib"]
}

function getNotes(){
    return lib.getNotes();
}
function editNote(id,title,text,color){
    lib.editNote(id,title,text,color);
}
function createNote(title,text,color){
    lib.createNote(title,text,color);
}
function deleteNote(id){
    lib.deleteNote(id);
}

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
