$("#searcher").on("keyup click input", function () {
    var val = $(this).val();
    if (val.length) {
        chooseFilter(val);
    }
    else {
        $(".note-index .note-tile").show();
    }
});

function chooseFilter(val) {

    $(".note-index .note-tile").hide().filter(function(){
        if (val[0] == "#") {
            return hashFilter(val, this);
        }
        else {
            return noteFilter(val, this);
        }
    }).show();

}

function noteFilter(val, elements) {
    return $(elements).get(0).innerText.toLowerCase().indexOf(val.toLowerCase()) != -1;
}

function hashFilter(val, elements) {
    var id = $(elements).get(0).getAttribute("data-id");
    var note = findNote(id);
    var hashes = note["hashes"]
    if (hashes) {
        hashes = hashes.filter(function(hash){
            return hash.toLowerCase().indexOf(val.toLowerCase()) != -1;
        });
        if (hashes.length > 0) {
            return true;
        }
    }
    return false;
}