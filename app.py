from flask import Flask, request, jsonify, render_template
import pdfplumber
import pyttsx3

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and file.filename.endswith('.pdf'):
        with pdfplumber.open(file) as pdf:
            text = "\n".join(page.extract_text() for page in pdf.pages)

        # Return text to front-end to display
        return jsonify({'text': text})
    return jsonify({'error': 'Invalid file format. Please upload a PDF.'}), 400

@app.route('/read', methods=['POST'])
def read():
    text = request.json.get('text', '')
    if text:
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
        return jsonify({"status": "Reading complete"})
    return jsonify({"error": "No text provided"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)  # Change the port as needed
