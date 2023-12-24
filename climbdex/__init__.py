import flask

import climbdex.api
import climbdex.views


def create_app():
    app = flask.Flask(__name__, instance_relative_config=True)
    app.register_blueprint(climbdex.api.blueprint)
    app.register_blueprint(climbdex.views.blueprint)
    return app
