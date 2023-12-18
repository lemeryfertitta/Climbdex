# Climbdex

Climbdex is a search engine for ["standardized interactive climbing training boards" (SICTBs)](https://gearjunkie.com/climbing/kilter-moon-grasshopper-more-interactive-climbing-training-boards-explained) designed with the goal of adding missing functionality to boards that utilize [Aurora Climbing's](https://auroraclimbing.com/) software, such as [Kilter](https://settercloset.com/pages/the-kilter-board), 
[Tension](https://tensionclimbing.com/product/tension-board-sets/), and [Decoy](https://decoy-holds.com/pages/decoy-board). The primary missing feature provided by this engine is a "filter by hold" feature to find climbs with specific sets of holds. There are some additional improvements to other options for filtering and sorting through climbs as well.

Try it out [here](https://lemeryfertitta.github.io/Climbdex/). Currently, all sizes of the Kilter Original layout are supported. The goal is to extend this project to cover all layouts and boards that run the Aurora Climbing software.

This app was partially inspired by Tim Parkin's excellent [Moonboard Search Engine](http://mb.timparkin.net/).

## Data

All data is populated via [a Python script](scripts/data_gen.py) which utilizes [BoardLib](https://github.com/lemeryfertitta/BoardLib) to download and query the climb databases for each board. Currently, the data is stored directly in the repository in compressed JSON files to keep the website static for free and easy hosting on Github Pages. The data must be refreshed manually by running this script and committing to the repository.
