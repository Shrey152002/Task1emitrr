import os
import spacy
import json
import pickle
from flask import Flask, render_template, request, jsonify
from collections import defaultdict
import re

# Initialize the Flask application
app = Flask(__name__)

# Load the NLP model
try:
    nlp = spacy.load("en_core_web_sm")
    # Save model to pickle file for deployment
    if not os.path.exists('model.pkl'):
        with open('model.pkl', 'wb') as f:
            pickle.dump(nlp, f)
except:
    # If model is not installed, try to load from pickle
    with open('model.pkl', 'rb') as f:
        nlp = pickle.load(f)

def process_medical_transcript(transcript_text):
    """
    Process a medical transcript to extract key medical entities and generate a structured summary.

    Args:
        transcript_text (str): The raw medical conversation transcript

    Returns:
        dict: Structured medical report in JSON format
    """
    # Process the text
    doc = nlp(transcript_text)

    # Initialize the structured report
    medical_report = {
        "Patient_Name": "",
        "Symptoms": [],
        "Diagnosis": "",
        "Treatment": [],
        "Current_Status": "",
        "Prognosis": ""
    }

    # Extract patient name (looking for Ms./Mr./Mrs. followed by a name)
    name_pattern = re.compile(r'(Ms\.|Mr\.|Mrs\.) ([A-Z][a-z]+)')
    name_matches = name_pattern.findall(transcript_text)
    if name_matches:
        medical_report["Patient_Name"] = f"{name_matches[0][1]}"  # Just last name for now

    # Define keyword patterns for different categories
    symptom_patterns = [
        "pain", "discomfort", "hit", "stiffness", "backache", "headache",
        "trouble", "difficulty", "tenderness", "anxiety", "emotional"
    ]

    diagnosis_patterns = [
        "whiplash", "injury", "damage", "condition", "diagnosed"
    ]

    treatment_patterns = [
        "physiotherapy", "therapy", "painkillers", "medication", "x-rays",
        "examination", "check", "emergency", "hospital", "session"
    ]

    current_status_patterns = [
        "feeling now", "occasional", "still experience", "better", "improving"
    ]

    prognosis_patterns = [
        "expect", "future", "recovery", "recover", "long-term",
        "predict", "forecast", "outlook", "prognosis"
    ]

    # Extract specific information using pattern matching and NLP
    symptoms = set()
    treatments = set()
    diagnosis = ""
    current_status = ""
    prognosis = ""

    # Split text into sentences for better context analysis
    sentences = [sent.text for sent in doc.sents]

    for sentence in sentences:
        sent_lower = sentence.lower()

        # Check for symptoms
        if any(pattern in sent_lower for pattern in symptom_patterns):
            # Look for body parts or specific symptoms
            for pattern in ["neck", "back", "head", "sleep", "pain"]:
                if pattern in sent_lower:
                    # Create contextualized symptoms
                    if "pain" in sent_lower and pattern != "pain":
                        symptoms.add(f"{pattern.capitalize()} pain")
                    elif pattern == "sleep" and "trouble" in sent_lower:
                        symptoms.add("Trouble sleeping")
                    elif pattern == "head" and "hit" in sent_lower:
                        symptoms.add("Head impact")

        # Check for diagnosis
        if any(pattern in sent_lower for pattern in diagnosis_patterns):
            if "whiplash" in sent_lower:
                diagnosis = "Whiplash injury"

        # Check for treatments
        if any(pattern in sent_lower for pattern in treatment_patterns):
            if "physiotherapy" in sent_lower or "therapy" in sent_lower:
                # Try to extract number of sessions
                session_match = re.search(r'(\d+)\s+sessions?', sent_lower)
                if session_match:
                    treatments.add(f"{session_match.group(1)} physiotherapy sessions")
                else:
                    treatments.add("Physiotherapy")

            if "painkillers" in sent_lower or "medication" in sent_lower:
                treatments.add("Painkillers")

            if "x-ray" in sent_lower:
                if "didn't" in sent_lower or "no" in sent_lower:
                    treatments.add("No X-rays performed")
                else:
                    treatments.add("X-rays")

        # Check for current status
        if any(pattern in sent_lower for pattern in current_status_patterns):
            if "occasional backache" in sent_lower or ("occasional" in sent_lower and "back" in sent_lower):
                current_status = "Occasional backache"
            elif "better" in sent_lower:
                current_status = "Improved condition with occasional discomfort"

        # Check for prognosis
        if any(pattern in sent_lower for pattern in prognosis_patterns):
            if "full recovery" in sent_lower:
                # Try to extract timeframe
                time_match = re.search(r'within (\w+) (months|weeks|years)', sent_lower)
                if time_match:
                    prognosis = f"Full recovery expected within {time_match.group(1)} {time_match.group(2)}"
                else:
                    prognosis = "Full recovery expected"

            if "no long-term" in sent_lower:
                if not prognosis:
                    prognosis = "No long-term impact expected"
                else:
                    prognosis += "; No long-term impact expected"

    # Update the report with extracted information
    medical_report["Symptoms"] = list(symptoms)
    medical_report["Diagnosis"] = diagnosis
    medical_report["Treatment"] = list(treatments)
    medical_report["Current_Status"] = current_status
    medical_report["Prognosis"] = prognosis

    return medical_report

def extract_keywords(text):
    """
    Extract important medical keywords/phrases from the text

    Args:
        text (str): Medical transcript text

    Returns:
        list: Important medical keywords/phrases
    """
    doc = nlp(text)

    # Define medical keywords to look for
    medical_terms = [
        "whiplash", "physiotherapy", "injury", "accident", "recovery",
        "pain", "backache", "neck pain", "emergency", "treatment",
        "mobility", "examination", "anxiety", "degeneration"
    ]

    # Extract phrases containing these terms
    keywords = []
    for sentence in doc.sents:
        sentence_text = sentence.text.lower()
        for term in medical_terms:
            if term in sentence_text:
                # Find the broader context for this term
                term_context = re.search(r'([^.!?]*{}[^.!?]*)'.format(term), sentence_text)
                if term_context:
                    context = term_context.group(1).strip()
                    # Only add if the context is meaningful (not too short)
                    if len(context) > len(term) + 5:
                        keywords.append(context.capitalize())
                    else:
                        keywords.append(term.capitalize())

    # Remove duplicates while preserving order
    seen = set()
    unique_keywords = []
    for keyword in keywords:
        if keyword.lower() not in seen:
            seen.add(keyword.lower())
            unique_keywords.append(keyword)

    return unique_keywords

def generate_medical_summary(transcript):
    """
    Main function to generate a complete medical summary from a transcript

    Args:
        transcript (str): The medical conversation transcript

    Returns:
        dict: Complete medical summary with structured report and keywords
    """
    # Process the transcript
    structured_report = process_medical_transcript(transcript)

    # Extract important medical keywords
    keywords = extract_keywords(transcript)

    # Combine into final output
    complete_summary = {
        "structured_report": structured_report,
        "important_medical_phrases": keywords
    }

    return complete_summary

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    if request.method == 'POST':
        transcript = request.form.get('transcript', '')
        
        if not transcript:
            return jsonify({'error': 'No transcript provided'}), 400
        
        try:
            result = generate_medical_summary(transcript)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

# For local development
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)