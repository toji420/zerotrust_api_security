"""
ZeroTrust AI Threat Detection Service
Isolation Forest + Rule-based Threat Scoring
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging
import math
from collections import Counter

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = "isolation_forest_model.pkl"
SCALER_PATH = "scaler.pkl"

# ⭐ 15 FEATURES
FEATURES = [
    'method_encoded','status_code','response_time_ms',
    'requests_last_minute','failed_requests_last_hour',
    'endpoint_depth','has_query_params','hour_of_day',
    'payload_length','suspicious_keyword_count','is_rare_method',
    'user_agent_risk','failure_ratio','payload_entropy','is_sensitive_endpoint'
]

# ⭐ Threat score table (your table)
THREAT_RULES = {
    "DDOS_ATTACK":0.98,
    "AUTOMATED_TOOL":0.97,
    "COMMAND_INJECTION":0.96,
    "SQL_INJECTION":0.95,
    "PATH_TRAVERSAL":0.93,
    "XSS_ATTACK":0.92,
    "RATE_ABUSE":0.90,
    "CREDENTIAL_STUFFING":0.88,
    "BRUTE_FORCE":0.85,
    "API_FUZZING":0.82,
    "PARAMETER_FLOODING":0.80,
    "SUSPICIOUS_HTTP_METHOD":0.78,
    "ACCOUNT_ENUMERATION":0.77,
    "ENDPOINT_SCANNING":0.75,
    "SLOW_REQUEST_PROBE":0.60
}

# ───────── Helpers ─────────

def entropy(text):
    if not text: return 0
    c = Counter(text)
    probs=[v/len(text) for v in c.values()]
    return -sum(p*math.log2(p) for p in probs)

# ───────── Model ─────────

def create_model():
    np.random.seed(42)
    n=1000

    normal=np.random.rand(n,len(FEATURES))

    scaler=StandardScaler()
    X=scaler.fit_transform(normal)

    model=IsolationForest(n_estimators=150,contamination=0.1,random_state=42)
    model.fit(X)

    joblib.dump(model,MODEL_PATH)
    joblib.dump(scaler,SCALER_PATH)

    return model,scaler

def load_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH),joblib.load(SCALER_PATH)
    return create_model()

model,scaler=load_model()
training_buffer=[]

# ───────── Feature Extraction ─────────

def extract_features(d):

    payload=str(d.get("payload","")).lower()
    endpoint=d.get("endpoint","")

    keywords=["select","union","script","../","cmd","exec","drop","alert"]
    keyword_count=sum(1 for k in keywords if k in payload)

    rare=1 if d.get("method") in ["TRACE","OPTIONS","CONNECT","DEBUG"] else 0
    sensitive=1 if any(x in endpoint for x in ["/admin","/config","/actuator","/internal"]) else 0

    failure_ratio=d.get('failed_requests_last_hour',0)/max(d.get('requests_last_minute',1),1)

    return [
        float(d.get('method_encoded',0)),
        float(d.get('status_code',200)),
        min(float(d.get('response_time_ms',200)),10000),
        float(d.get('requests_last_minute',0)),
        float(d.get('failed_requests_last_hour',0)),
        float(d.get('endpoint_depth',2)),
        float(d.get('has_query_params',0)),
        float(d.get('hour_of_day',12)),
        len(payload),
        keyword_count,
        rare,
        float(d.get("user_agent_risk",0)),
        failure_ratio,
        entropy(payload),
        sensitive
    ]

# ───────── Threat Classification ─────────

def classify_threat(d,score):

    payload=str(d.get("payload","")).lower()
    ua=str(d.get("user_agent","")).lower()

    rpm=d.get("requests_last_minute",0)
    fails=d.get("failed_requests_last_hour",0)
    status=d.get("status_code",200)
    resp=d.get("response_time_ms",0)
    unique_ep=d.get("unique_endpoints_last_10min",0)
    server_err=d.get("server_errors_last_10min",0)
    param_count=d.get("param_count",0)

    if rpm>200:
        return "DDOS_ATTACK",THREAT_RULES["DDOS_ATTACK"]

    if any(x in ua for x in ["sqlmap","nikto","nmap","burp","zap","curl"]):
        return "AUTOMATED_TOOL",THREAT_RULES["AUTOMATED_TOOL"]

    if any(x in payload for x in [";whoami","&&","|","exec","cmd"]):
        return "COMMAND_INJECTION",THREAT_RULES["COMMAND_INJECTION"]

    if any(x in payload for x in ["union select","1=1","drop table","--"]):
        return "SQL_INJECTION",THREAT_RULES["SQL_INJECTION"]

    if "../" in payload:
        return "PATH_TRAVERSAL",THREAT_RULES["PATH_TRAVERSAL"]

    if any(x in payload for x in ["<script","onerror","alert("]):
        return "XSS_ATTACK",THREAT_RULES["XSS_ATTACK"]

    if rpm>100:
        return "RATE_ABUSE",THREAT_RULES["RATE_ABUSE"]

    if fails>20:
        return "CREDENTIAL_STUFFING",THREAT_RULES["CREDENTIAL_STUFFING"]

    if fails>10 and status in [401,403]:
        return "BRUTE_FORCE",THREAT_RULES["BRUTE_FORCE"]

    if server_err>15:
        return "API_FUZZING",THREAT_RULES["API_FUZZING"]

    if param_count>50:
        return "PARAMETER_FLOODING",THREAT_RULES["PARAMETER_FLOODING"]

    if d.get("method") in ["TRACE","TRACK","DEBUG"]:
        return "SUSPICIOUS_HTTP_METHOD",THREAT_RULES["SUSPICIOUS_HTTP_METHOD"]

    if status==404 and rpm>20:
        return "ACCOUNT_ENUMERATION",THREAT_RULES["ACCOUNT_ENUMERATION"]

    if unique_ep>30:
        return "ENDPOINT_SCANNING",THREAT_RULES["ENDPOINT_SCANNING"]

    if resp>10000:
        return "SLOW_REQUEST_PROBE",THREAT_RULES["SLOW_REQUEST_PROBE"]

    if score>0.9:
        return "ZERO_DAY_ANOMALY",score

    return "NORMAL",score

# ───────── Routes ─────────

@app.route("/health")
def health():
    return jsonify({"status":"healthy","features":len(FEATURES)})

@app.route("/predict",methods=["POST"])
def predict():
    try:
        data=request.get_json()

        f=extract_features(data)
        X=scaler.transform([f])

        pred=model.predict(X)[0]
        raw=model.decision_function(X)[0]

        anomaly=max(0,min(1,1-(raw+0.5)))
        threat,confidence=classify_threat(data,anomaly)

        if len(training_buffer)<500:
            training_buffer.append(f)

        return jsonify({
            "isAnomaly":bool(pred==-1),
            "anomalyScore":round(anomaly,4),
            "threatType":threat,
            "confidence":round(confidence,2)
        })

    except Exception as e:
        logger.error(e)
        return jsonify({"error":str(e)})

@app.route("/retrain",methods=["POST"])
def retrain():
    global model,scaler,training_buffer
    if len(training_buffer)<100:
        return jsonify({"msg":"not enough data"})

    X=np.array(training_buffer)
    scaler=StandardScaler()
    Xs=scaler.fit_transform(X)

    model=IsolationForest(n_estimators=150,contamination=0.1)
    model.fit(Xs)

    joblib.dump(model,MODEL_PATH)
    joblib.dump(scaler,SCALER_PATH)
    training_buffer=[]

    return jsonify({"msg":"retrained"})

@app.route("/model/stats")
def stats():
    return jsonify({"buffer":len(training_buffer),"features":len(FEATURES)})

if __name__=="__main__":
    app.run(host="0.0.0.0",port=5001)