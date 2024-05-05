import sys
import flask
import logging

import climbdex.api
import climbdex.views

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

def create_app():
    app = flask.Flask(__name__, instance_relative_config=True)
    app.url_map.strict_slashes = False
    app.register_blueprint(climbdex.api.blueprint)
    app.register_blueprint(climbdex.views.blueprint)
    return app
