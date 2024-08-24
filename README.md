# Climbdex

Climbdex is a search engine for ["standardized interactive climbing training boards" (SICTBs)](https://gearjunkie.com/climbing/kilter-moon-grasshopper-more-interactive-climbing-training-boards-explained) designed with the goal of adding missing functionality to boards that utilize [Aurora Climbing's](https://auroraclimbing.com/) software, such as [Kilter](https://settercloset.com/pages/the-kilter-board), 
[Tension](https://tensionclimbing.com/product/tension-board-sets/), and [Decoy](https://decoy-holds.com/pages/decoy-board). The primary missing feature provided by this engine is a "filter by hold" feature to find climbs with specific sets of holds. There are some additional improvements to other options for filtering and sorting through climbs as well.

Try it out [here](https://climbdex.com/).

This app was partially inspired by Tim Parkin's excellent [Moonboard Search Engine](http://mb.timparkin.net/).

The climb databases are downloaded and synchronized using the [BoardLib](https://github.com/lemeryfertitta/BoardLib) Python library. 

## Features

These are the features that Climbdex provides which are currently not supported by the official apps:

- Hold filtering
  - Select holds to require them to be present in the resulting climbs.
  - Click multiple times on a hold to change the color.
  - If "strict" color matching is selected, the color of the hold must be an exact match. If "any" color matching is selected, the color of the holds will be ignored. If "only hands" color matching is selected, the color of the hold must match one of the hand hold colors (start, middle, or finish).
  - On mirrored board layouts, the mirror image of the filtered hold sequence will also be included in the search results.
- Precise quality and difficulty ratings
  - The exact average (to the hundredths place) of the grade and star ratings are displayed to give a better sense of the true difficulty and quality of a climb.
  - There is a "difficulty accuracy" filter which can be used in combination with minimum ascents to help find benchmark climbs of a grade.
- Bookmarking
  - Filters are stored in query params such that a specific search or setup can be bookmarked.
  - For example: [Kilter V5s at 40° with at least 500 ascents, sorted by quality](https://climbdex.com/results?minGrade=20&maxGrade=20&name=&angle=40&minAscents=500&sortBy=quality&sortOrder=desc&minRating=1.0&onlyClassics=0&gradeAccuracy=1&settername=&setternameSuggestion=&holds=&mirroredHolds=&board=kilter&layout=1&size=10&set=1&set=20&roleMatch=strict) or the [TB2 mirror layout](https://climbdex.com/filter?board=tension&layout=10&size=6&set=12&set=13).
- Web access
  - No mobile app required to search for climbs
  - To light up the climbs, the mobile app is needed, but if app links are setup correctly, you can click on the climb name in Climbdex and be taken directly to the climb on the app.
  - Climbdex is a [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) which means the app can be installed on almost any platform and behave similarly to a native mobile or desktop app.
- All of the supported boards on one app.

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
