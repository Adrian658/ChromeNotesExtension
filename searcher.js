/*
 *   Adds listener to search bar
 */
$("#searcher").on("keyup click input", function () {
    var val = $(this).val();
    filteredIds = filterNotes(val);
    if (val.length) {
        chooseFilter(val);
        /* Deprecated code for searching a note body
           Should be added to noteFilter() if implemented */
        /*$(".note-index .note-tile").hide().filter(function () {
            var div = $(this).get(0);
            var dataid = Number(div.getAttribute("data-id"));
            return filteredIds.includes(dataid);
        }).show();*/
    }
    else {
        $(".note-index .note-tile").show();
    }
});

/*
*   Determines whether to filter by hashes or notes depending on the search criteria
*   If search begins with #, filter by hashtag, otherwise by title
*/
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

/*
 *   Filters through all note titles and returns those matching search criteria
 */
function noteFilter(val, elements) {
    return $(elements).get(0).innerText.toLowerCase().indexOf(val.toLowerCase()) != -1;
}

/*
 *   Filters through all hashes and returns those matching search criteria
 */
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