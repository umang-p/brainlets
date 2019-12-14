# brainlets

[brainlets.moe](http://brainlets.moe) is a simple website that features a few tools for the mobile game known as Girls' Frontline.

## Overview

The key draw of this project is the [damage simulator](http://brainlets.moe/gf/sim/), a tool used by thousands of players across the world. The damage simulator aims to be user-friendly and up to date, all while attempting to be as accurate as a web-based simulator can be. As there are many other popular websites that feature other useful tools and guides for the game, the sim will remain the focus of project brainlets, as opposed to the development of other tools/pages.

This project was started on a whim by someone with no development experience. As such, there is a LOT of room for improvement. The technologies used were all chosen arbitrarily, as was the general design of the sim. Any and all feedback is welcome, and highly appreciated.

## Contributing

Simply fork this repo, make changes, and submit a pull request. Just please be sure to test any changes you make. Feel free to reach out to me with any questions you may have.

To get started:
1. Fork this repo
2. Have python3 installed (version 3.3+ preferred)
3. [Create a virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment) and [activate](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#activating-a-virtual-environment) it
4. Install project dependencies using `pip install -r requirements.txt`
5. Make a copy of `brainlets/brainlets/sample_settings.py` named `settings.py`
6. Use `python manage.py collectstatic` (`manage.py` is found in `brainlets/`)
6. Use `python manage.py runserver` to start the dev server (defaults to `127.0.0.1:8000`)

## License

This project is under the [GNU General Public License v3](https://github.com/umang-p/brainlets/blob/master/LICENSE.txt).
