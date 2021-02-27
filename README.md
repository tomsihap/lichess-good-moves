# lichess-good-moves
> Show good moves and book moves into Lichess analysis, the same way Chess.com does.
> The accuracy may be debated and just like chess.com does, there is no consensus on what makes a move being a good move. This is purely informational and to have a more optimisic analysis of you game !
> 
> Please feel free to contribute !


## Openings

The script can show you when you and your opponent followed book moves, and which opening have been followed.

![Openings](images/opening.PNG?raw=true "Openings")

## Good moves, excellent moves, brillancies

You now can see when you have made a good, excellent move or a brillancy !

![Good moves](images/goodmove.PNG?raw=true "Good moves")

They are defined as such :
- Good move !?
- Excellent move !
- Brillancy !!

You can also see a summary of your good moves in the analysis table :

![Table](images/table.PNG?raw=true "Table")


### How are defined good/excellent/brillancies moves ?

Since you cannot really tell when a move is good (see [this StackOverflow thread](https://chess.stackexchange.com/questions/24378/why-does-lichess-only-tell-me-my-inaccuracies-mistakes-and-blunders-and)), the decision have been made that moves between the following thresolds are defined as good/excellent/brillancy :

```
From white prospective:
- Good :+0.6 centipawn
- Excellent: +1.0 centipawn
- Brillancy: +2.0 centipawn
```

Also, checkmates in X moves have been defined as `+100` centipawn.

These values are from my own trial and errors, please feel free to contribute to make these values more accurate.


# How to install

First, you will need to install a browser extension to run external scripts.

- Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=fr
- Firefox: https://addons.mozilla.org/fr/firefox/addon/greasemonkey/

When installed, you can get the `script.js` [file here](script.js) and copy-paste it into Tampermonkey/Greasemonkey.

