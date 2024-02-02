# Climbdex

Climbdex is a search engine for ["standardized interactive climbing training boards" (SICTBs)](https://gearjunkie.com/climbing/kilter-moon-grasshopper-more-interactive-climbing-training-boards-explained) designed with the goal of adding missing functionality to boards that utilize [Aurora Climbing's](https://auroraclimbing.com/) software, such as [Kilter](https://settercloset.com/pages/the-kilter-board), 
[Tension](https://tensionclimbing.com/product/tension-board-sets/), and [Decoy](https://decoy-holds.com/pages/decoy-board). The primary missing feature provided by this engine is a "filter by hold" feature to find climbs with specific sets of holds. There are some additional improvements to other options for filtering and sorting through climbs as well.

Try it out [here](https://climbdex.fly.dev/).

This app was partially inspired by Tim Parkin's excellent [Moonboard Search Engine](http://mb.timparkin.net/).

The databases are downloaded and synchronized using [BoardLib](https://github.com/lemeryfertitta/BoardLib). 

## Features

These are the features that Climbdex provides which are (as of last updating this document) not supported by the official apps:

- Hold filter - select holds to require them to be present in the resulting climbs. Click again on the hold to change the color. If "strict" color matching is selected, the color of the hold must be an exact match. If "any" color matching is selected, the color of the holds will be ignored.
- Minimum ascents and minimum rating filters - these can be used in combination with different sort categories to curate a better list of results. The apps offer sorting by these categories but do not offer control over minimums. Try filtering by a large number of ascents and then sorting by rating to get the best climbs.
- Bookmarking - because filters are stored in query params, you can bookmark a board setup or a specific search results. For example, [accurately graded Kilter V5s at 40°](https://climbdex.fly.dev/results?angle=40&minAscents=100&minRating=1.0&minGrade=20&maxGrade=20&gradeAccuracy=0.05&sortBy=quality&sortOrder=desc&holds=&mirroredHolds=&%3Fangle=40&minAscents=200&minRating=1.0&minGrade=20&maxGrade=21&sortBy=quality&sortOrder=desc&holds=&board=kilter&layout=1&size=10&set=1&set=20&roleMatch=strict&roleMatch=strict) or the [TB2 10x8 Mirror layout](https://climbdex.fly.dev/filter?board=tension&layout=10&size=9&set=12&set=13).
- Web access - no mobile app required. To light up the climbs, the mobile app is needed, but if app links are setup correctly, you can click on the climb name in Climbdex and be taken directly to the climb on the app.
- All-in-one - all of the supported boards on one website, no app-switching required.

## Development

To run Climbdex locally, clone the repository and install the Python dependencies ([venv](https://docs.python.org/3/library/venv.html) reccommended):

```
python3 -m pip install -r requirements.txt
```

After the dependencies are installed, start a server:

```
gunicorn wsgi:app
```

To actually use most of the features of Climbdex, at least one of the local SQLite databases are required. To download a database, use the `sync_db` script:

```
bin/sync_db.sh <board_name>
```

where `<board_name>` is one of `decoy`, `grasshopper`, `kilter`, `tension` or `touchstone`.
