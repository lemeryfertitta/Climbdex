from flask import Flask, request, jsonify, Blueprint, json
from flask_cors import CORS
from flask_parameter_validation import ValidateParameters, Json, Query
import boardlib.api.aurora  # Import the boardlib.api.aurora module
import logging
import climbdex.db

app = Flask(__name__)
CORS(app)  # Enable CORS for the entire app
blueprint = Blueprint("api", __name__)

logging.basicConfig(level=logging.DEBUG)  # Enable logging

def parameter_error(e):
    code = 400
    name = str(type(e).__name__)
    description = f"Parameters were missing and/or misconfigured. If the issue persists, please <a href=\"https://github.com/lemeryfertitta/Climbdex/issues/new?title={str(type(e).__name__)}: {str(e)} ({code})\" target='_blank'>report it</a> (code: {code})"

    response = {
        "error": True,
        "code": code,
        "name": name,
        "description": description,
    }, code

    logging.error(response)
    return response

@blueprint.errorhandler(Exception)
def handle_exception(e):
    logging.error(f"Unhandled exception: {str(e)}", exc_info=True)
    response = e.get_response()
    response.data = json.dumps({
        "error": True,
        "code": e.code,
        "name": e.name,
        "description": f"There was a problem while getting results from the server. If the issue persists, please <a href=\"https://github.com/lemeryfertitta/Climbdex/issues/new?title={e.name} ({e.code})&body={e.description}\" target='_blank'>report it</a> (code: {e.code})",
    })
    response.content_type = "application/json"
    logging.error(response.data)
    return response

@blueprint.route("/api/v1/<board_name>/layouts")
def layouts(board_name):
    return jsonify(climbdex.db.get_data(board_name, "layouts"))

@blueprint.route("/api/v1/<board_name>/layouts/<layout_id>/sizes")
def sizes(board_name, layout_id):
    return jsonify(
        climbdex.db.get_data(board_name, "sizes", {"layout_id": int(layout_id)})
    )

@blueprint.route("/api/v1/<board_name>/layouts/<layout_id>/sizes/<size_id>/sets")
def sets(board_name, layout_id, size_id):
    return jsonify(
        climbdex.db.get_data(
            board_name, "sets", {"layout_id": int(layout_id), "size_id": int(size_id)}
        )
    )

@blueprint.route("/api/v1/search/count")
@ValidateParameters(parameter_error)
def resultsCount(
    gradeAccuracy: float = Query(),
    layout: int = Query(),
    maxGrade: int = Query(),
    minAscents: int = Query(),
    minGrade: int = Query(),
    minRating: float = Query(),
    size: int = Query(),
):
    return jsonify(climbdex.db.get_search_count(request.args))

@blueprint.route("/api/v1/search")
@ValidateParameters(parameter_error)
def search(
    gradeAccuracy: float = Query(),
    layout: int = Query(),
    maxGrade: int = Query(),
    minAscents: int = Query(),
    minGrade: int = Query(),
    minRating: float = Query(),
    size: int = Query(),
):
    return jsonify(climbdex.db.get_search_results(request.args))

@blueprint.route("/api/v1/<board_name>/beta/<uuid>")
def beta(board_name, uuid):
    return jsonify(climbdex.db.get_data(board_name, "beta", {"uuid": uuid}))

@blueprint.route("/api/v1/login/", methods=["POST"])
def login():
    try:
        login_details = boardlib.api.aurora.login(
            request.json["board"],
            request.json["username"],
            request.json["password"],
        )
        return jsonify(
            {"token": login_details["token"], "user_id": login_details["user_id"]}
        )
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == requests.codes.unprocessable_entity:
            return (
                jsonify({"error": "Invalid username/password combination"}),
                e.response.status_code,
            )
        else:
            return jsonify({"error": str(e)}), e.response.status_code

@blueprint.route("/api/v1/save_ascent", methods=["POST"])
@ValidateParameters(parameter_error)
def api_save_ascent(
    board: str = Json(),
    climb_uuid: str = Json(),
    angle: int = Json(),
    is_mirror: bool = Json(),
    attempt_id: int = Json(),
    bid_count: int = Json(),
    quality: int = Json(),
    difficulty: int = Json(),
    is_benchmark: bool = Json(),
    comment: str = Json(),
    climbed_at: str = Json(),
):
    try:
        login_cookie = request.cookies.get(f"{board}_login")
        if not login_cookie:
            return jsonify({"error": "Login required"}), 401

        login_info = json.loads(login_cookie)
        token = login_info["token"]
        user_id = login_info["user_id"]

        # Use the imported save_ascent function from boardlib.api.aurora
        result = boardlib.api.aurora.save_ascent(
            board=board,
            token=token,
            user_id=user_id,
            climb_uuid=climb_uuid,
            angle=angle,
            is_mirror=is_mirror,
            attempt_id=attempt_id,
            bid_count=bid_count,
            quality=quality,
            difficulty=difficulty,
            is_benchmark=is_benchmark,
            comment=comment,
            climbed_at=climbed_at
        )
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error in save_ascent: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

app.register_blueprint(blueprint)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
