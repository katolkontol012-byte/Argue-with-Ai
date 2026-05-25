from flask import Flask, request, send_file
from flask_cors import CORS
from gtts import gTTS
import io

app = Flask(__name__)
CORS(app)

@app.route('/speak', methods=['POST'])
def speak():
    text = request.json.get('text', '')
    if not text:
        return {'error': 'No text provided'}, 400

    mp3 = io.BytesIO()
    tts = gTTS(text=text, lang='en', slow=False)
    tts.write_to_fp(mp3)
    mp3.seek(0)

    return send_file(mp3, mimetype='audio/mpeg')

if __name__ == '__main__':
    print("TTS Server running on http://localhost:5000")
    app.run(port=5000)