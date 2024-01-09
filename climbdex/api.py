import flask

import climbdex.db

blueprint = flask.Blueprint("api", __name__)


@blueprint.route("/api/v1/<board_name>/layouts")
def layouts(board_name):
    return flask.jsonify(climbdex.db.get_data(board_name, "layouts"))


@blueprint.route("/api/v1/<board_name>/layouts/<layout_id>/sizes")
def sizes(board_name, layout_id):
    return flask.jsonify(
        climbdex.db.get_data(board_name, "sizes", {"layout_id": int(layout_id)})
    )


@blueprint.route("/api/v1/<board_name>/layouts/<layout_id>/sizes/<size_id>/sets")
def sets(board_name, layout_id, size_id):
    return flask.jsonify(
        climbdex.db.get_data(
            board_name, "sets", {"layout_id": int(layout_id), "size_id": int(size_id)}
        )
    )


@blueprint.route("/api/v1/search/count")
def resultsCount():
    return flask.jsonify(climbdex.db.get_search_count(flask.request.args))


@blueprint.route("/api/v1/search")
def search():
    return flask.jsonify(climbdex.db.get_search_results(flask.request.args))
