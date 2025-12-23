from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json, os
from flask import send_from_directory

app = Flask(__name__)
app.secret_key = "dev-secret"
CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "https://mango-moss-05db4bc10.2.azurestaticapps.net"
    ]
)

app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True
)

DATA_DIR = "data"
UPLOAD_DIR = "uploads"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

def load_json(name, default):
    path = f"{DATA_DIR}/{name}.json"
    if not os.path.exists(path):
        with open(path, "w") as f:
            json.dump(default, f)
    try:
        with open(path) as f:
            return json.load(f)
    except json.JSONDecodeError:
        # overwrite empty or invalid file
        with open(path, "w") as f:
            json.dump(default, f)
        return default

def save_json(name, data):
    with open(f"{DATA_DIR}/{name}.json", "w") as f:
        json.dump(data, f)

users = load_json("users", {
    "jas": {"password": "harhar"},
    "vinita": {"password": "toothless"},
    "angle": {"password": "gorilla"},
    "diego": {"password": "batman"},
    "adan": {"password": "girlypop"},
    "roch": {"password": "bad"},
    "test": {"password": "tester"},
    "shmado": {"password": "hypothetically"}
})

questions = load_json("questions", [
    {
        "id": 1,
        "question": "What year did we meet?",
        "options": ["2019", "2020", "2021"],
        "answer": "2020",
        "points": 10
    },
    {
        "id": 2,
        "question": "Upload a picture from our last trip",
        "image_required": True,
        "points": 15
    }
])

scores = load_json("scores", {})
answers = load_json("answers", {})
uploads = load_json("uploads", {})  # user -> list of filenames



@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = users.get(data["username"])
    if not user or user["password"] != data["password"]:
        return jsonify({"error": "Invalid credentials"}), 401

    session["user"] = data["username"]
    scores.setdefault(data["username"], 0)
    save_json("scores", scores)
    return jsonify({"success": True})

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

@app.route("/uploads.json")
def get_uploads_json():
    return jsonify(uploads)

@app.route("/question")
def get_question():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(questions)

@app.route("/answer", methods=["POST"])
def answer():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    qid = data["id"]
    submitted_answer = data.get("answer")

    # Get or create answered list for user
    user_answers = answers.setdefault(user, [])

    # Prevent re-answering
    if qid in user_answers:
        return jsonify({"error": "Already answered"}), 400

    for q in questions:
        if q["id"] == qid:
            user_answers.append(qid)
            save_json("answers", answers)

            if q.get("answer") == submitted_answer:
                scores[user] += q["points"]
                save_json("scores", scores)
                return jsonify({"correct": True})

            return jsonify({"correct": False})

    return jsonify({"error": "Question not found"}), 404


@app.route("/upload", methods=["POST"])
def upload():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    qid = int(request.form["id"])
    file = request.files["image"]
    filename = f"{user}_{qid}.jpg"
    file.save(f"{UPLOAD_DIR}/{filename}")

    # Track uploaded images
    uploads.setdefault(str(qid), []).append(filename)
    save_json("uploads", uploads)

    scores[user] += 10
    save_json("scores", scores)
    save_json("uploads", uploads)

    return jsonify({"success": True})


@app.route("/leaderboard")
def leaderboard():
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(sorted_scores)

if __name__ == "__main__":
    app.run(debug=True)
