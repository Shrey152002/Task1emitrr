# Task1emitrr
# Medical Transcript Analyzer

A Flask-based web application that processes medical conversation transcripts and generates structured medical reports using Natural Language Processing (NLP).

## Overview

The Medical Transcript Analyzer extracts key medical information from doctor-patient conversation transcripts and organizes it into a structured format. The application uses spaCy for NLP processing and pattern matching to identify important medical entities and context.

![Medical Transcript Analyzer Interface](https://github.com/Shrey152002/Task1emitrr/blob/main/Screenshot%202025-03-17%20124022.png)

## Features

- Upload and process medical conversation transcripts
- Extract patient information, symptoms, diagnosis, treatment details, and prognosis
- Generate structured medical reports with key clinical information
- Identify important medical phrases and keywords from conversations
- Export results in JSON or text format

## How It Works

1. The application processes raw medical transcripts using spaCy NLP
2. Pattern matching and keyword extraction identify medical entities and context
3. Information is organized into a structured medical report format
4. Results are displayed in an easy-to-read interface

## Sample Output

The application generates a comprehensive medical report with the following sections:

**Patient Information:**
![Patient Information](https://github.com/Shrey152002/Task1emitrr/blob/main/Screenshot%202025-03-17%20124043.png)

**Treatment, Status, and Medical Phrases:**
![Treatment and Status](https://github.com/Shrey152002/Task1emitrr/blob/main/Screenshot%202025-03-17%20124114.png)

## Technical Details

- **Backend**: Python Flask application with spaCy NLP
- **NLP Processing**: Entity recognition, pattern matching, and contextual analysis
- **Data Structure**: JSON-formatted medical reports
- **Deployment**: Includes pickle support for model portability

## Implementation

The core functionality is implemented in three main functions:

1. `process_medical_transcript()`: Extracts structured information from text
2. `extract_keywords()`: Identifies important medical phrases and keywords
3. `generate_medical_summary()`: Combines structured data and keywords into a complete report

## Installation and Usage

1. Clone the repository
2. Install dependencies: `pip install flask spacy`
3. Download spaCy model: `python -m spacy download en_core_web_sm`
4. Run the application: `python app.py`
5. Access the web interface at `http://localhost:5000`

## Deployment

For deployment, the application includes functionality to save and load the spaCy model as a pickle file, making it easier to deploy in environments where installing models might be restricted.
