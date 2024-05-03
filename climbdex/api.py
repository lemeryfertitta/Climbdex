from flask_parameter_validation import ValidateParameters, Query

import boardlib.api.aurora
import flask
import requests

import climbdex.db

blueprint = flask.Blueprint("api", __name__)

def error_handler(err):
    details = str(err)
    error_type = str(type(err).__name__)
    message = f"There was an issue getting results from the api. If the issue persists please <a href=\"https://github.com/lemeryfertitta/Climbdex/issues/new?title={str(type(err).__name__)}: {str(err)}\" target='_blank'>report it</a>"

    return {
        "error": True,
        "details": details,
        "type": error_type,
        "message": message,
    }, 400


@blueprint.route("/api/v1/<board_name>/layouts")
def layouts(board_name):
    try:
        return flask.jsonify(climbdex.db.get_data(board_name, "layouts"))
    except Exception as e:
        return error_handler(e)


@blueprint.route("/api/v1/<board_name>/layouts/<layout_id>/sizes")
def sizes(board_name, layout_id):
    try:
        return flask.jsonify(
            climbdex.db.get_data(board_name, "sizes", {"layout_id": int(layout_id)})
        )
    except Exception as e:
        return error_handler(e)


@blueprint.route("/api/v1/<board_name>/layouts/<layout_id>/sizes/<size_id>/sets")
def sets(board_name, layout_id, size_id):
    try:
        return flask.jsonify(
            climbdex.db.get_data(
                board_name, "sets", {"layout_id": int(layout_id), "size_id": int(size_id)}
            )
        )
    except Exception as e:
        return error_handler(e)


@blueprint.route("/api/v1/search/count")
@ValidateParameters(error_handler)
def resultsCount(
    gradeAccuracy: float = Query(),
    layout: int = Query(),
    maxGrade: int = Query(),
    minAscents: int = Query(),
    minGrade: int = Query(),
    minRating: float = Query(),
    size: int = Query(),
):
    try:
        return flask.jsonify(climbdex.db.get_search_count(flask.request.args))
    except Exception as e:
        return error_handler(e)

@blueprint.route("/api/v1/search")
@ValidateParameters(error_handler)
def search(
    gradeAccuracy: float = Query(),
    layout: int = Query(),
    maxGrade: int = Query(),
    minAscents: int = Query(),
    minGrade: int = Query(),
    minRating: float = Query(),
    size: int = Query(),
):
    try:
        return flask.jsonify(climbdex.db.get_search_results(flask.request.args))
    except Exception as e:
        return error_handler(e)


@blueprint.route("/api/v1/<board_name>/beta/<uuid>")
def beta(board_name, uuid):
    try:
        return flask.jsonify(climbdex.db.get_data(board_name, "beta", {"uuid": uuid}))
    except Exception as e:
        return error_handler(e)


@blueprint.route("/api/v1/login/", methods=["POST"])
def login():
    try:
        login_details = boardlib.api.aurora.login(
            flask.request.json["board"],
            flask.request.json["username"],
            flask.request.json["password"],
        )
        return flask.jsonify(
            {"token": login_details["token"], "user_id": login_details["user_id"]}
        )
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == requests.codes.unprocessable_entity:
            return (
                flask.jsonify({"error": "Invalid username/password combination"}),
                e.response.status_code,
            )
        else:
            return flask.jsonify({"error": str(e)}), e.response.status_code
