import sys
import flask
import logging
import os

import climbdex.api
import climbdex.views

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)


def create_app():
    app = flask.Flask(
        __name__,
        instance_relative_config=True,
        static_folder='../my-react-app/build',  # Path to React build directory
        static_url_path='/react'  # Serve static files under /react
    )
    app.url_map.strict_slashes = False

    # Register blueprints for the Flask app
    app.register_blueprint(climbdex.api.blueprint)
    app.register_blueprint(climbdex.views.blueprint)

    # Serve React's index.html for all /react routes
    @app.route('/react', defaults={'path': ''})
    @app.route('/react/<path:path>')
    def serve_react_app(path):
        # Serve index.html if no specific file is found
        if path == "" or not os.path.exists(os.path.join(app.static_folder, path)):
            return app.send_static_file('index.html')
        else:
            return app.send_static_file(path)

    return app
