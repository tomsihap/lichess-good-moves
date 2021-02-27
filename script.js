// ==UserScript==
// @name         Lichess Good Moves
// @namespace    https://github.com/tomsihap
// @version      0.1
// @description  Show Brillant, Best, Excellent moves and book moves as chess.com does.
// @author       Thomas Sihapanya
// @require      https://greasyfork.org/scripts/47911-font-awesome-all-js/code/Font-awesome%20AllJs.js?version=275337
// @include      /^https\:\/\/lichess\.org\/[a-zA-Z0-9]{8,}/
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    const GOOD_MOVE_THRESOLD = 0.6;
    const EXCELLENT_MOVE_THRESOLD = 1;
    const BRILLANT_MOVE_THRESOLD = 2;
    const CHECKMATE_IN_X_MOVES_VALUE = 100;

    let goodMoves = {
        white : {
            'book' : 0,
            'good' : 0,
            'excellent': 0,
            'brillant': 0,
        },
        black : {
            'book' : 0,
            'good' : 0,
            'excellent': 0,
            'brillant': 0,
        }
    }


    /**
     * Wait for the page to load all its elements before running the script
     */
    window.addEventListener('load', function() {

        /**
         * Create click event since .click on elements doesn't work quite well in Chrome
         */
        let clickEvent = document.createEvent('MouseEvents');
        clickEvent.initMouseEvent('mousedown', true, true);

        /**
         * Moves explorer must be opened to detect book moves. If not, user is prompted to run an analysis and reload the page.
         */
        const formAnalysis = document.getElementsByClassName('future-game-analysis')[0];

        if (typeof(formAnalysis) !== 'undefined') {
            alert('Lichess Good Moves: please run an analysis and reload the page when finished. You will then be prompted to accept cross-origin resource : you can safely allow it (it will fetch data for an opening API) !');
        }

        /**
         * Check if users is in analysis page and analysis has been run
         */
        if (document.getElementsByClassName('analyse__tools').length > 0
            && document.getElementsByClassName('future-game-analysis').length === 0
            && document.getElementsByClassName('computer-analysis active').length > 0) {

            const ecoCodesApiUrl = 'https://raw.githubusercontent.com/tomsihap/eco.json/master/eco.json';

            /**
             * Loads ECO codes API
             * https://raw.githubusercontent.com/tomsihap/eco.json/master/eco.json
             */
            function loadEcoCodesApi() {
                GM.xmlHttpRequest({
                    method: "GET",
                    url:ecoCodesApiUrl,
                    onload: function(response) {
                        lichessGoodMoves(JSON.parse(response.responseText));
                    },
                    onerror: function(err) {
                        alert('Lichess Good Moves script cannot be launched (maybe you have forbid the access to a cross-origin resource ?) - Refresh the page if you want to start again.');
                    }
                });
            }

            function loadMoves(ecoCodes) {
                let domMoves = document.getElementsByTagName('move');
                let moves = [];
                let previousEval = {
                    value: '+0.0',
                    symbol: '+',
                    absVal: '0.0'
                };

                Object.values(domMoves).forEach(domMove => {
                    if (!domMove.classList.contains('empty')) {
                        if ("undefined" !== typeof(domMove.childNodes)) {

                            domMove.childNodes.forEach(node => {

                                if ('SAN' === node.tagName) {
                                    /**
                                     * Handle opening
                                     */
                                    moves.push(node.innerHTML);

                                    let currentColor = checkColor(moves.length-1);
                                    let currentPgn = createPgnMoves(moves);
                                    let foundOpening = ecoCodes.find(eco => eco.moves.toLowerCase().trim() == currentPgn.toLowerCase().trim());

                                    if (typeof(foundOpening) !== 'undefined') {
                                        handleOpeningMove(node, foundOpening, currentColor);
                                    }

                                    /**
                                     * Handle evaluation
                                     */
                                    let currentEval = {
                                        textValue: node.parentElement.getElementsByTagName('eval')[0].innerHTML,
                                        symbol: node.parentElement.getElementsByTagName('eval')[0].innerHTML.charAt(0)
                                    }

                                    if (currentEval.symbol == '#') {
                                        currentEval.value = currentColor == 'white' ? - CHECKMATE_IN_X_MOVES_VALUE : CHECKMATE_IN_X_MOVES_VALUE;
                                    }
                                    else {
                                        currentEval = {
                                            textValue: currentEval.textValue,
                                            symbol: currentEval.symbol,
                                            value: (currentEval.symbol == '+') ? parseFloat(currentEval.textValue.substring(1)) : 0 - parseFloat(currentEval.textValue.substring(1))
                                        }
                                    }

                                    let delta = currentEval.value - previousEval.value;

                                    let moveText = node.innerHTML;

                                    if ("white" === currentColor) {
                                        if (delta >= GOOD_MOVE_THRESOLD && delta < EXCELLENT_MOVE_THRESOLD) {
                                            node.innerHTML = '<span style="color: #b2f196;">'+
                                                                    moveText+'!?'+
                                                            '</span>';

                                            goodMoves.white.good++;
                                        }
                                        if (delta >= EXCELLENT_MOVE_THRESOLD && delta < BRILLANT_MOVE_THRESOLD) {
                                            node.innerHTML = '<span style="color: #96bc4b;">'+
                                                                    moveText+'!'+
                                                            '</span>';

                                            goodMoves.white.excellent++;
                                        }
                                        if (delta >= BRILLANT_MOVE_THRESOLD) {
                                            node.innerHTML = '<span style="color: #1baca6;">'+
                                                                    moveText+'!!'+
                                                            '</span>';

                                            goodMoves.white.brillant++;
                                        }
                                    }

                                    if ("black" === currentColor) {
                                        if (delta <= -GOOD_MOVE_THRESOLD && delta > -EXCELLENT_MOVE_THRESOLD) {
                                            node.innerHTML = '<span style="color: #b2f196;">'+
                                                                    moveText+'!?'+
                                                            '</span>';

                                            goodMoves.black.good++;
                                        }
                                        if (delta <= -EXCELLENT_MOVE_THRESOLD && delta > -BRILLANT_MOVE_THRESOLD) {
                                            node.innerHTML = '<span style="color: #96bc4b;">'+
                                                                    moveText+'!'+
                                                            '</span>';

                                            goodMoves.black.excellent++;
                                        }
                                        if (delta <= -BRILLANT_MOVE_THRESOLD) {
                                            node.innerHTML = '<span style="color: #1baca6;">'+
                                                                    moveText+'!!'+
                                                            '</span>';

                                            goodMoves.black.brillant++;
                                        }
                                    }

                                    previousEval = currentEval;

                                }
                            })
                        }
                    }
                });

                return moves;
            }

            function handleOpeningMove(node, opening, currentColor) {
                const moveText = node.innerHTML;

                node.innerHTML = '<span style="color: #a88865;">'+
                                        moveText+
                                        ' <i class="fas fa-book" style="font-size: 0.7em"></i>'+
                                '</span>'+
                                '<pre style="font-size:0.7em; width:0">'+opening.name+'</pre>';

                node.parentElement.title = opening.name;

                goodMoves[currentColor].book++;
            }

            function checkColor(index) {
                if (0 === index%2) {
                    return "white";
                }
                if (0 !== index%2) {
                    return "black";
                }
            }

            function createPgnMoves(moves) {

                let pgn = '';

                moves.forEach((move, index) => {
                    if ("white" === checkColor(index)) {
                        pgn += (index/2+1) + '. ' + move;
                    }
                    if ("black" === checkColor(index)) {
                        pgn += ' ' + move + ' ';
                    }
                });

                return pgn;
            }

            function showDataInTable() {
                const inaccuracyRows = document.querySelectorAll('[data-symbol="?!"]');

                const whiteInaccuracies = inaccuracyRows[0];
                const blackInaccuracies = inaccuracyRows[1];

                const whiteTable = whiteInaccuracies.parentElement;
                const blackTable = blackInaccuracies.parentElement;

                /**
                 * White separator
                 */
                const trWhiteSeparator = document.createElement('tr');
                trWhiteSeparator.classList.add('symbol');
                trWhiteSeparator.setAttribute('data-color', 'white');
                trWhiteSeparator.setAttribute('data-symbol', '--');
                const tdWhiteSeparator = document.createElement('td')
                tdWhiteSeparator.innerHTML = "-";
                const thWhiteSeparator = document.createElement('th')
                thWhiteSeparator.innerHTML = '---';
                trWhiteSeparator.append(tdWhiteSeparator)
                trWhiteSeparator.append(thWhiteSeparator);
                whiteTable.prepend(trWhiteSeparator);

                /**
                 * White book
                 */
                const trWhiteBook = document.createElement('tr');
                trWhiteBook.classList.add('symbol');
                trWhiteBook.setAttribute('data-color', 'white');
                trWhiteBook.setAttribute('data-symbol', 'Book');
                const tdWhiteBook = document.createElement('td')
                tdWhiteBook.innerHTML = goodMoves.white.book;
                const thWhiteBook = document.createElement('th')
                thWhiteBook.innerHTML = 'Book moves';
                trWhiteBook.append(tdWhiteBook)
                trWhiteBook.append(thWhiteBook);
                whiteTable.prepend(trWhiteBook);

                /**
                 * White good
                 */
                const trWhiteGood = document.createElement('tr');
                trWhiteGood.classList.add('symbol');
                trWhiteGood.setAttribute('data-color', 'white');
                trWhiteGood.setAttribute('data-symbol', '!?');
                const tdWhiteGood = document.createElement('td')
                tdWhiteGood.innerHTML = goodMoves.white.good;
                const thWhiteGood = document.createElement('th')
                thWhiteGood.innerHTML = 'Good moves';
                trWhiteGood.append(tdWhiteGood)
                trWhiteGood.append(thWhiteGood);
                whiteTable.prepend(trWhiteGood);

                /**
                 * White excellent
                 */
                const trWhiteExcellent = document.createElement('tr');
                trWhiteExcellent.classList.add('symbol');
                trWhiteExcellent.setAttribute('data-color', 'white');
                trWhiteExcellent.setAttribute('data-symbol', '!');
                const tdWhiteExcellent = document.createElement('td')
                tdWhiteExcellent.innerHTML = goodMoves.white.brillant;
                const thWhiteExcellent = document.createElement('th')
                thWhiteExcellent.innerHTML = 'Excellent moves';
                trWhiteExcellent.append(tdWhiteExcellent)
                trWhiteExcellent.append(thWhiteExcellent);
                whiteTable.prepend(trWhiteExcellent);

                /**
                 * White brillancies
                 */
                const trWhiteBrillancies = document.createElement('tr');
                trWhiteBrillancies.classList.add('symbol');
                trWhiteBrillancies.setAttribute('data-color', 'white');
                trWhiteBrillancies.setAttribute('data-symbol', '!!');
                const tdWhiteBrillancies = document.createElement('td')
                tdWhiteBrillancies.innerHTML = goodMoves.white.brillant;
                const thWhiteBrillancies = document.createElement('th')
                thWhiteBrillancies.innerHTML = 'Brillancies';
                trWhiteBrillancies.append(tdWhiteBrillancies)
                trWhiteBrillancies.append(thWhiteBrillancies);
                whiteTable.prepend(trWhiteBrillancies);

                /**
                 * Black separator
                 */
                const trBlackSeparator = document.createElement('tr');
                trBlackSeparator.classList.add('symbol');
                trBlackSeparator.setAttribute('data-color', 'black');
                trBlackSeparator.setAttribute('data-symbol', '--');
                const tdBlackSeparator = document.createElement('td')
                tdBlackSeparator.innerHTML = "-";
                const thBlackSeparator = document.createElement('th')
                thBlackSeparator.innerHTML = '---';
                trBlackSeparator.append(tdBlackSeparator)
                trBlackSeparator.append(thBlackSeparator);
                blackTable.prepend(trBlackSeparator);

                /**
                 * Black book
                 */
                const trBlackBook = document.createElement('tr');
                trBlackBook.classList.add('symbol');
                trBlackBook.setAttribute('data-color', 'black');
                trBlackBook.setAttribute('data-symbol', 'Book');
                const tdBlackBook = document.createElement('td')
                tdBlackBook.innerHTML = goodMoves.black.book;
                const thBlackBook = document.createElement('th')
                thBlackBook.innerHTML = 'Book moves';
                trBlackBook.append(tdBlackBook)
                trBlackBook.append(thBlackBook);
                blackTable.prepend(trBlackBook);

                /**
                 * Black good
                 */
                const trBlackGood = document.createElement('tr');
                trBlackGood.classList.add('symbol');
                trBlackGood.setAttribute('data-color', 'black');
                trBlackGood.setAttribute('data-symbol', '!?');
                const tdBlackGood = document.createElement('td')
                tdBlackGood.innerHTML = goodMoves.black.good;
                const thBlackGood = document.createElement('th')
                thBlackGood.innerHTML = 'Good moves';
                trBlackGood.append(tdBlackGood)
                trBlackGood.append(thBlackGood);
                blackTable.prepend(trBlackGood);

                /**
                 * Black excellent
                 */
                const trBlackExcellent = document.createElement('tr');
                trBlackExcellent.classList.add('symbol');
                trBlackExcellent.setAttribute('data-color', 'black');
                trBlackExcellent.setAttribute('data-symbol', '!');
                const tdBlackExcellent = document.createElement('td')
                tdBlackExcellent.innerHTML = goodMoves.black.brillant;
                const thBlackExcellent = document.createElement('th')
                thBlackExcellent.innerHTML = 'Excellent moves';
                trBlackExcellent.append(tdBlackExcellent)
                trBlackExcellent.append(thBlackExcellent);
                blackTable.prepend(trBlackExcellent);

                /**
                 * Black brillancies
                 */
                const trBlackBrillancies = document.createElement('tr');
                trBlackBrillancies.classList.add('symbol');
                trBlackBrillancies.setAttribute('data-color', 'black');
                trBlackBrillancies.setAttribute('data-symbol', '!!');
                const tdBlackBrillancies = document.createElement('td')
                tdBlackBrillancies.innerHTML = goodMoves.black.brillant;
                const thBlackBrillancies = document.createElement('th')
                thBlackBrillancies.innerHTML = 'Brillancies';
                trBlackBrillancies.append(tdBlackBrillancies)
                trBlackBrillancies.append(thBlackBrillancies);
                blackTable.prepend(trBlackBrillancies);
            }

            function lichessGoodMoves(ecoCodes) {

                console.log('Lichess Good Moves successfully started.');

                /**
                 * Load moves
                 */

                loadMoves(ecoCodes);
                showDataInTable();
            }

            // Start the app !
            loadEcoCodesApi();

        } // check if users is in analysis page
    }, false); // addEventListener('load', callback)
})(); // Immediately-Invoked Function Expression (function() {})())
