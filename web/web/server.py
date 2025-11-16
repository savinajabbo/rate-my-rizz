from flask import Flask, Response, request, jsonify
import cv2
app = Flask(__name__)

camera = cv2.VideoCapture(0)

def generate_flames():
  while True:
    success, frame = camera.read()
    if not success:
      break
    else:
      _, buffer = cv2.imencode('.jpg', frame)
    frame = buffer.tobytes()
    
    yield (b'--frame\r\n'b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route("/video")
def video():
  return Response(generate_flames(), 
                  mimetype='multipart/x-mixed-replace; boundary=frame')
  
  @app.route("index.html")
  def index():
    return open("index.html").read()

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