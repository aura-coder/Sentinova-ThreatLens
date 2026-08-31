from flask import Flask, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

indicators = [
    {"id": 1, "indicator": "185.165.29.101", "type": "IP", "score": 85, "status": "active"},
    {"id": 2, "indicator": "malware.exe", "type": "Hash", "score": 92, "status": "active"},
]

@app.route('/api/indicators')
def get_indicators():
    return jsonify(indicators)

@app.route('/api/stats')
def get_stats():
    return jsonify({
        "total": 50,
        "active": 15,
        "whitelisted": 5,
        "high_severity": 8
    })

@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
