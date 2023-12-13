# Aurora Hold Filter

The Aurora Hold Filter is a webpage designed with the goal of adding missing search functionality to climbing boards that utilize [Aurora Climbing's](https://auroraclimbing.com/) software, such as [Kilter](https://settercloset.com/pages/the-kilter-board), 
[Tension](https://tensionclimbing.com/product/tension-board-sets/), and [Decoy](https://decoy-holds.com/pages/decoy-board). The primary missing feature provided by this page is a "filter by hold" feature to find climbs with specific sets of holds. There are some additional improvements to other options for filtering and sorting through climbs as well.

Try it out [here](https://lemeryfertitta.github.io/AuroraHoldFilter/). Currently, only the original 16x12 Kilter layout is supported. The goal is to extend this project to cover all layouts and boards that run Aurora Climbing software.

This app was partially inspired by Tim Parkin's excellent [Moonboard Search Engine](http://mb.timparkin.net/).

## Data

All data is populated via [a Python script](scripts/data_gen.py) which utilizes [BoardLib](https://github.com/lemeryfertitta/BoardLib) to download and query the climb databases for each board. Currently, the data is stored in minified JS files to keep the website static for Github Pages, but the eventual goal would be a hosted app which maintains and serves the data. 
