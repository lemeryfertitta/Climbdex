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


    @app.before_request
    def log_request_info():
        app.logger.info(f"Request Headers: {flask.request.headers}")
        app.logger.info(f"Request Path: {flask.request.path}")

    # Register blueprints for the Flask app
    app.register_blueprint(climbdex.api.blueprint)
    app.register_blueprint(climbdex.views.blueprint)

    # Serve React's index.html for all /react routes
    @app.route('/react', defaults={'path': ''})
    @app.route('/react/<path:path>')
    def serve_react_app(path):
        # TODO: Just use NGINX so that deep links work
        # If the path exists in the static folder, serve the static file
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return app.send_static_file(path)
        else:
            # Serve index.html for all other routes to handle deep linking
            return app.send_static_file('index.html')

    return app
