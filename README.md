# Aurora Hold Filter

Aurora Hold Filter is a web app designed with goal of adding the missing "search by hold" functionality to Aurora-based board software (Kilter, Tension, etc.).

Try it out [here](https://lemeryfertitta.github.io/AuroraHoldFilter/). Currently, only the original 16x12 Kilter layout is supported. The goal is to extend this project to cover all layouts and boards that run Aurora Climbing software.

## Data Population

All data is populated via a Python script which utilizes [BoardLib](https://github.com/lemeryfertitta/BoardLib) to download and query the climb databases. The data is stored in minified JS files to utilize the free Github Pages hosting service. See [data_gen.py](scripts/data_gen.py) for details.
