/* Wait for the page to load then run the function*/
$(document).ready(function () {
    setUpSearchResults();
    setUpSignalReasons();
    setUpPlayerNotes();
});

/* Function 1: Simulated Search */

/*  Either shows pretend results or a clean error message */
function setUpSearchResults() {
    let resultsBox = $("div#search-results");

    /* If it's a different page like index.html, there's no search results box so exit this funcion*/
    if (resultsBox.length === 0) {
        return;
    }

    /* The search form uses GET, so this finds the search term */
    let urlData = new URLSearchParams(window.location.search);
    let typedPhrase = urlData.get("q");

    /* If there is no search term, like if they go to the page directly, set it to empty string to avoid errors */
    if (typedPhrase === null) {
        typedPhrase = "";
    }

    /* Ignore extra spaces and capital letters*/
    typedPhrase = typedPhrase.trim();
    let keyphrase = typedPhrase.toLowerCase();

    /* Put the phrase back in the header search box */
    $("input#search-box").val(typedPhrase);

    let summary = $("p#search-summary");

    switch (keyphrase) {
        /* The keyphrases including his full name and last name since there are no other players on my rosters that share his first or last name */
        case "jacoby":
        case "jacoby brissett":
        case "brissett":
            summary.text("2 results for \"" + typedPhrase + "\"");
            resultsBox.append(makeResult(
                "Jacoby Brissett",
                "detail-team.html",
                "Player",
                "QB, Arizona Cardinals - Week 2: 9.6 pts, Season: 26.2 pts, EPA per play: -0.02, Signal: Hold"
            ));
            resultsBox.append(makeResult(
                "Arizona Cardinals",
                "detail-team.html",
                "NFL Team",
                "Jacoby Brissett is the quarterback on this NFL Team roster that you follow."
            ));
            break;

        /* The user didn't actually search for anything */
        case "":
            summary.text("You didn't type anything to search for.");
            resultsBox.append(makeNoResultsMessage());
            break;

        /* If the user put in anything else, since this is a simulated search, there's nothing to find */
        default:
            summary.text("No results for \"" + typedPhrase + "\"");
            resultsBox.append(makeNoResultsMessage());
            break;
    }
}

/* 2 cases: either there was a search term or there wasn't */

/* Title is the linked heading, link is the link, badgeText is Player or Team, description is the related text. This function took me forever to make. */
function makeResult(title, link, badgeText, description) {
    let result = $("<section></section>").addClass("panel search-result");
    let heading = $("<h2></h2>");
    let headingLink = $("<a></a>").attr("href", link).text(title);
    let badge = $("<p></p>").addClass("badge").text(badgeText);
    let details = $("<p></p>").text(description);

    heading.append(headingLink);
    result.append(heading, badge, details);
    return result;
}

/* If there are no results, a message needs to be displayed */
function makeNoResultsMessage() {
    let message = $("<div></div>").addClass("no-results");
    let sorry = $("<p></p>").text("Sorry, PylonIQ couldn't find a player with that name. Try one of these:");
    let ideas = $("<ul></ul>");
    let searchLink = $("<a></a>").attr("href", "search.html?q=Jacoby").text("Search for Jacoby");
    let rosterLink = $("<a></a>").attr("href", "list.html").text("Look through your rosters");

    /* Each link goes in its own list item*/
    ideas.append($("<li></li>").append(searchLink));
    ideas.append($("<li></li>").append(rosterLink));
    message.append(sorry, ideas);
    return message;
}














/* Function 2: Deal with the clicks to show trade signals */

/*  Clicking a player row once changes its class (changing an existing element) and adds a new row under it that explains the trade signal (adding a new element). */
function setUpSignalReasons() {
    let playerTableBody = $("section.roster-players table.stats-table tbody");

    /*  1 click handler sits on the <tbody>, and jQuery only runs it when the click happened inside a player row, not a reason row. */
    playerTableBody.on("click", "tr:not(.reason-row)", function (event) {
        let clickedRow = $(this);

        /* If the clicked row has the reason, close it */
        if (clickedRow.hasClass("selected-row")) {
            closeSignalReason(clickedRow.parent());
            return;
        }

        /* Close any open explanation rows */
        closeSignalReason(clickedRow.parent());

        /* Extract the player's name, points, EPA, and trade signal */
        let playerName = clickedRow.children("th").contents().first().text();
        let weekPoints = clickedRow.children("td").eq(1).text();
        let epa = clickedRow.children("td").eq(3).text();
        let signal = clickedRow.find("span.badge").text();

        /* Build the new row */
        let reasonHeading = $("<strong></strong>").text("Why " + signal + "? ");
        let reasonText = $("<span></span>").text(makeSignalReason(signal, playerName, weekPoints, epa));
        let reasonCell = $("<td></td>").attr("colspan", clickedRow.children().length);
        let reasonRow = $("<tr></tr>").addClass("reason-row");

        reasonCell.append(reasonHeading, reasonText);
        reasonRow.append(reasonCell);

        clickedRow.addClass("selected-row");    /* add a class for the selected row */
        clickedRow.after(reasonRow);            /* add the new row below */
    });
}

/*  Closes an explanation by taking the selected tag and getting rid of the reason row */
function closeSignalReason(tableBody) {
    tableBody.children("tr.selected-row").removeClass("selected-row");
    tableBody.children("tr.reason-row").remove();
}

/*  Explains the signal with real numbers */
function makeSignalReason(signal, playerName, weekPoints, epa) {
    let reason = "";

    switch (signal) {
        case "Buy Low":
            reason = playerName + " only scored " + weekPoints + " fantasy points in Week 2, but his EPA per play of " + epa + " says he is playing well. Better weeks are probably coming, so trade for him while he is cheap.";
            break;
        case "Sell High":
            reason = playerName + " scored " + weekPoints + " fantasy points in Week 2, but his EPA per play is only " + epa + ". His points look better than his play, so trade him before they drop.";
            break;
        case "Hold":
            reason = playerName + "'s " + weekPoints + " fantasy points in Week 2 match his EPA per play of " + epa + ". His points are about what his play has earned, so there is no reason to trade him.";
            break;
        default:
            reason = "There is no trade signal for " + playerName + " yet.";
            break;
    }

    return reason;
}









/* Function 3: Player Notes */

/*  Double-clicking a player's name changes the name cell class (changes an existing element) and adds a small form to type a note (adds a new element). */
function setUpPlayerNotes() {
    let nameCells = $("section.roster-players table.stats-table tbody th");

    nameCells.on("dblclick", function () {
        let nameCell = $(this);

        /* If the note form is already open in the cell, don't add another one */
        if (nameCell.children("form.note-form").length > 0) {
            return;
        }

        /* Start at name cell and then move around, so you read the player's name, position, and existing note if it exists */
        let playerName = nameCell.contents().first().text();
        let position = nameCell.siblings("td").first().text();
        let oldNote = nameCell.children("p.player-note");

        /* Build the form with a text box and a Save button */
        let noteForm = $("<form></form>").addClass("note-form");
        let noteBox = $("<input />").attr({
            "type": "text",
            "maxlength": "60",
            "placeholder": "Note about " + playerName
        });
        let saveButton = $("<input />").attr({ "type": "submit", "value": "Save" });

        /* If he already has a note, edit it */
        noteBox.val(oldNote.text());
        oldNote.remove();

        noteForm.append(noteBox, saveButton);
        noteForm.on("submit", savePlayerNote);

        nameCell.addClass("has-note");
        nameCell.append(noteForm);
        noteBox.trigger("focus"); /* put the cursor in the box, ready to type */
    });
}

/*  Save the note */
function savePlayerNote(event) {
    /* Don't reload the page like normal */
    event.preventDefault();

    /* Go down to the text box then up to the name cell */
    let noteForm = $(this);
    let noteText = noteForm.children("input[type='text']").val().trim();
    let nameCell = noteForm.closest("th");

    if (noteText === "") {
        /* An empty note means "no note", so there shouldn't be a class*/
        nameCell.removeClass("has-note");
    } else {
        let note = $("<p></p>").addClass("player-note").text(noteText);
        nameCell.append(note);
    }

    noteForm.remove();
}