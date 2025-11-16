from flask import flask, request, jsonify
app = flask(__name__)

@app.route("/")
def home():
  return app.send_static_file
@app.route("/rate", methods=["POST"])
def rate():
  data  = request.get_json()
  text  = data.get("text", "")

  score  = len(text)
  
  return jsonify({"score": score})

app.run(port=5000)