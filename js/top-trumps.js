$(function(){
    var indexes = [],
        cards = [];
        highScore = 0;
    indexes.holdingIndex = 0;
    indexes.challengingIndex = 0;
    cards.holdingCards = null;
    cards.challengingCards = null;

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

    function setupPack (countries){
        countries.sort(function() { return 0.5 - Math.random() }); // shuffle
        cards.holdingCards = countries.splice(0, countries.length/2);
        cards.challengingCards = countries;
        if('localStorage' in window && localStorage.getItem("highScore") !== null){
            highScore = JSON.parse(localStorage.getItem("highScore"));
        } else {
            highScore = cards.holdingCards.length;
        }
        updateHighScore();
        drawCard("holding");
        drawCard("challenging");
    }

    function drawCard(deck){
        // Reset back to 0 if at the end
        if(indexes[deck + "Index"] == cards[deck + "Cards"].length){
            indexes[deck + "Index"] = 0;
        }
        var index = indexes[deck + "Index"];
        var array = cards[deck + "Cards"];
        var card = array[index];
        showCard(card, deck);
        indexes[deck + "Index"]++;
    }

    function showCard(card, deck){
        // Create flag
        var flag = $("<img/>", {
            "src": "svg/country-4x3/" + card.alpha2Code.toLowerCase() + ".svg"
        });
        
        // Add to DOM
        $("#" + deck + "-card .inner").html("<h1>" + card.name + "</h1>")
        .append(flag)
        .append($("<div/>", { 
                                "class": "facts"
                             })
            .append("<strong>Native name:</strong> " + card.nativeName + "<br> " + 
                    "<strong>Capital:</strong> " + card.capital)

            // Criteria to play with
            .append(createCriterion("Area", formatNumber(card.area), " km<sup>2</sup>", deck))
            .append(createCriterion("Population", formatNumber(card.population), "", deck))
            .append(createCriterion("Borders", formatNumber(card.borders.length), "", deck))

        )
        .append("<div class='cards-remaining clear'><strong>Cards remaining: </strong><span>" + cards[deck + "Cards"].length + "</span></div>");
    }

    function createCriterion(key, value, suffix, deck){
        var container = $("<div/>", {
            "html": "<strong>" + key + ":</strong> ",
            "class": "criterion clearfix"
        });

        if(deck == "holding"){
            container.append($("<span/>", {
                html: value + suffix
            }));
            container.on("click", function(){
                // Convert to number
                var holdingVal = (value) ? parseInt(value.replace(/,/g,'')) : value;
                var challengingCard = takeOpposingCard(deck, false);
                var challengingVal = challengingCard[key.toLowerCase()];
                // Measure length of array if needed
                challengingVal = (typeof(challengingVal) != "number") ? challengingVal.length : challengingVal;
                var result = (holdingVal > challengingVal) ? "WIN" : (holdingVal < challengingVal) ? "LOSE" : "TIE";
                
                // If Win, take card, else if Lose, give it up
                if(result == "WIN"){
                    takeCard(deck);
                    updateHighScore(cards.holdingCards.length);
                } else if (result == "LOSE"){
                    takeCard(swapDeck(deck));
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
        $("#" + deck + "-card .cards-remaining span").text(myDeck.length);
    }

    function swapDeck(deck) {
        return (deck == "holding") ? "challenging" : "holding";
    }

    function takeOpposingCard(deck, remove){
        var deckToTakeFrom = swapDeck(deck);
        var index = indexes[deckToTakeFrom + "Index"]-1;
        var cardsToTakeFrom = cards[deckToTakeFrom + "Cards"];
        var card = (remove) ? cardsToTakeFrom.splice(index, 1)[0] : cardsToTakeFrom[index];
        return card;
    }   

    function formatNumber (num) {
        return (num) ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") : 0;
    }

    function updateHighScore (score){
        if(score > highScore){
            highScore = score;
            if('localStorage' in window){
                localStorage.setItem("highScore", JSON.stringify(highScore));
            }
        }
        $("#high-score span").text(highScore);
    }
});
