$(function(){
    var cards = [],
        highScore = 0;
        packSize = 0;
    cards.holdingCards = null;
    cards.challengingCards = null;

    init();

    function init(){
        if('localStorage' in window && localStorage.getItem("countries") !== null){
            var countries = JSON.parse(localStorage.getItem("countries"));
            setupPack(countries);
        } else {
            $.getJSON("country-data.json", function(countries){
                if('localStorage' in window){
                    localStorage.setItem("countries", JSON.stringify(countries));
                }
                setupPack(countries);
            });
        }
    }

    function setupPack (countries){
        countries.sort(function() { return 0.5 - Math.random() }); // Shuffle deck
        
        // Render the pack size select box (one-time only)
        createPackSizeSelector(countries.length);

        // Re-size the pack if needed
        if(packSize > 0){
            countries = countries.splice(0, packSize);
        }
        packSize = countries.length;
        cards.holdingCards = countries.splice(0, countries.length/2); // Split in two
        cards.challengingCards = countries;
        // Read/Set high score data
        if('localStorage' in window && localStorage.getItem("highScore") !== null){
            highScore = JSON.parse(localStorage.getItem("highScore"));
        } else {
            highScore = cards.holdingCards.length;
        }
        // Render high score on page
        updateHighScore();
        // Draw the cards
        drawCard("holding");
        drawCard("challenging");
    }

    // Draw a card from the deck
    function drawCard(deck){
        if(cards[deck + "Cards"].length == 0){
            // Game over
            $("#" + deck + "-card .inner").html("<h1>Game over</h1>" + 
            ((cards["holdingCards"].length == 0) ? "You lose" : "You win!"));
            updateCardsRemaining(deck);
        } else {
            // Pick a new card
            var array = cards[deck + "Cards"];
            var card = array[0];
            // Render it
            showCard(card, deck);
        }
    }

    function showCard(card, deck){
        // Create flag
        var flag = $("<img/>", {
            "src": "svg/country-4x3/" + card.alpha2Code.toLowerCase() + ".svg"
        });
        
        // Add to DOM
        $("#" + deck + "-card .inner").hide().html("<h1>" + card.name + "</h1>")
        .append(flag)
        .append($("<div/>", { "class": "facts" })
                .append("<strong>Native name:</strong> " + card.nativeName + "<br> " + 
                        "<strong>Capital:</strong> " + card.capital + "<br>" +
                        "<strong>Region:</strong> " + card.subregion)

                // Criteria to play with
                .append(createCriterion("Area", numberWithoutCommas(card.area), " km<sup>2</sup>", deck))
                .append(createCriterion("Population", numberWithoutCommas(card.population), "", deck))
                .append(createCriterion("Borders", numberWithoutCommas(card.borders.length), "", deck))    
        );
        updateCardsRemaining(deck);
        preloadNextImage(deck);
        $("#" + deck + "-card .inner").fadeIn(300);
    }

    function createCriterion(key, value, suffix, deck){
        var container = $("<div/>", {
            "html": "<strong>" + key + ":</strong> ",
            "class": "criterion clearfix",
            "id": deck + "-" + key.toLowerCase()
        });

        if(deck == "holding"){
            container.append($("<span/>", {
                html: value + suffix
            }));
            container.on("click", function(){
                var result = decideResult(key, value, deck);
                
                // If Win, take card, else if Lose, give it up
                if(result == "WIN"){
                    takeCard(deck);
                    updateHighScore(cards.holdingCards.length);
                    updateCardsRemaining(deck);
                } else if (result == "LOSE"){
                    flashChallengingValue(deck, key);
                    takeCard(swapDeck(deck));
                    updateCardsRemaining(swapDeck(deck));
                } else if (result == "TIE"){
                    // Do something clever
                }
            });
        } else {
            container.append($("<span/>", { 
                text: "?"
            }));
        }
        return container;
    }

    function takeCard(deck){
        var card = takeOpposingCard(deck, true);
        var myDeck = cards[deck + "Cards"];
        myDeck.push(card);
        drawCard(swapDeck(deck));
    }

    function swapDeck(deck) {
        return (deck == "holding") ? "challenging" : "holding";
    }

    function takeOpposingCard(deck, remove){
        var deckToTakeFrom = swapDeck(deck);
        var cardsToTakeFrom = cards[deckToTakeFrom + "Cards"];
        var card = (remove) ? cardsToTakeFrom.splice(0, 1)[0] : cardsToTakeFrom[0];
        return card;
    }   

    function getChallengingValue(card, key){
        var challengingVal = card[key.toLowerCase()];
        // Measure length of array if needed
        challengingVal = (typeof(challengingVal) != "number") ? challengingVal.length : challengingVal;
        return challengingVal;
    }

    function flashChallengingValue(deck, key){
        var challengingVal = getChallengingValue(takeOpposingCard(deck, false), key);
        var valDiv = $("#challenging-" + key.toLowerCase()).find("span");
        var valStr = numberWithCommas(challengingVal);
        if(key.toLowerCase() == "area"){
            valStr += " km<sup>2</sup>";
        }
        
        valDiv.fadeOut("fast", function() {
           $(this).html(numberWithCommas(valStr)).fadeIn();
        });
        setTimeout(function(){
            valDiv.fadeOut("fast", function() {
                $(this).html("?").fadeIn();
            });
        },1500);
    }

    function decideResult(key, value, deck){
        // Convert to number
        var holdingVal = (value) ? parseInt(value.replace(/,/g,'')) : value;
        var challengingCard = takeOpposingCard(deck, false);
        var challengingVal = getChallengingValue(challengingCard, key);
        var result = (holdingVal > challengingVal) ? "WIN" : (holdingVal < challengingVal) ? "LOSE" : "TIE";
        return result;
    }

    function numberWithoutCommas (num) {
        return (num) ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : 0;
    }

    function numberWithCommas (num) {
        return num.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    }

    function updateHighScore (score, reset){
        if(score > highScore || reset){
            highScore = score;
            if('localStorage' in window){
                localStorage.setItem("highScore", JSON.stringify(highScore));
            }
        }
        $("#high-score span").text(highScore);
    }

    function updateCardsRemaining(deck){
        $("#" + deck + "-cards-remaining span").text(cards[deck + "Cards"].length);
    }

    function createPackSizeSelector(fullPackSize){
        if($("#pack-size-selector").length == 0){
            var selectBox = $("<select/>", {"id": "pack-size-selector"});
            selectBox.append($("<option/>", {"value": fullPackSize, "text": "Full (" + fullPackSize + ")"}));
            selectBox.append($("<option/>", {"value": Math.round(fullPackSize/2), "text": "Half (" + Math.round(fullPackSize/2) + ")"}));
            selectBox.append($("<option/>", {"value": Math.round(fullPackSize/3), "text": "Third (" + Math.round(fullPackSize/3) + ")"}));
            selectBox.append($("<option/>", {"value": Math.round(fullPackSize/4), "text": "Quarter (" + Math.round(fullPackSize/4) + ")"}));
            selectBox.on("change", function(e){
                packSize = $("option:selected", this).val();
                e.stopPropagation();
            });
            $("#re-draw").append(selectBox);
        }
    }

    function preloadNextImage(deck){
        // Get the next one
        var card = cards[deck + "Cards"][1];
        if(card){
            var nextImage = new Image();
            nextImage.src = "svg/country-4x3/" + card.alpha2Code.toLowerCase() + ".svg";
        }
                
    }

    $("#reset-score").on("click", function(e){
            updateHighScore(cards.holdingCards.length, true);
            e.preventDefault();
    });
    $("#re-draw").on("click", function(e){
            // Re-draw (unless we're just changing the pack size)
            if(!$(e.target).is("select")){
                init();
            }
            e.preventDefault();
    });
});
