document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const transcriptForm = document.getElementById('transcriptForm');
    const transcriptTextarea = document.getElementById('transcript');
    const processBtn = document.getElementById('processBtn');
    const sampleBtn = document.getElementById('sampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultContainer = document.getElementById('resultContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');
    const resultError = document.getElementById('resultError');
    const exportJsonBtn = document.getElementById('exportJson');
    const exportTxtBtn = document.getElementById('exportTxt');
    
    // Store the last processed result
    let lastResult = null;
    
    // Sample medical transcript
    const sampleTranscript = `
    Physician: Good morning, Ms. Jones. How are you feeling today?
    Patient: Good morning, doctor. I'm doing better, but I still have some discomfort now and then.
    Physician: I understand you were in a car accident last September. Can you walk me through what happened?
    Patient: Yes, it was on September 1st, around 12:30 in the afternoon. I was driving from Cheadle Hulme to Manchester when I had to stop in traffic. Out of nowhere, another car hit me from behind, which pushed my car into the one in front.
    Physician: That sounds like a strong impact. Were you wearing your seatbelt?
    Patient: Yes, I always do.
    Physician: What did you feel immediately after the accident?
    Patient: At first, I was just shocked. But then I realized I had hit my head on the steering wheel, and I could feel pain in my neck and back almost right away.
    Physician: Did you seek medical attention at that time?
    Patient: Yes, I went to Moss Bank Accident and Emergency. They checked me over and said it was a whiplash injury, but they didn't do any X-rays. They just gave me some advice and sent me home.
    Physician: How did things progress after that?
    Patient: The first four weeks were rough. My neck and back pain were really bad—I had trouble sleeping and had to take painkillers regularly. It started improving after that, but I had to go through ten sessions of physiotherapy to help with the stiffness and discomfort.
    Physician: That makes sense. Are you still experiencing pain now?
    Patient: It's not constant, but I do get occasional backaches. It's nothing like before, though.
    Physician: That's good to hear. Have you noticed any other effects, like anxiety while driving or difficulty concentrating?
    Patient: No, nothing like that. I don't feel nervous driving, and I haven't had any emotional issues from the accident.
    Physician: And how has this impacted your daily life? Work, hobbies, anything like that?
    Patient: I had to take a week off work, but after that, I was back to my usual routine. It hasn't really stopped me from doing anything.
    Physician: That's encouraging. Let's go ahead and do a physical examination to check your mobility and any lingering pain.
    [Physical Examination Conducted]
    Physician: Everything looks good. Your neck and back have a full range of movement, and there's no tenderness or signs of lasting damage. Your muscles and spine seem to be in good condition.
    Patient: That's a relief!
    Physician: Yes, your recovery so far has been quite positive. Given your progress, I'd expect you to make a full recovery within six months of the accident. There are no signs of long-term damage or degeneration.
    Patient: That's great to hear. So, I don't need to worry about this affecting me in the future?
    Physician: That's right. I don't foresee any long-term impact on your work or daily life. If anything changes or you experience worsening symptoms, you can always come back for a follow-up. But at this point, you're on track for a full recovery.
    Patient: Thank you, doctor. I appreciate it.
    Physician: You're very welcome, Ms. Jones. Take care, and don't hesitate to reach out if you need anything.
    `;
    
    // Form submission handler
    transcriptForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const transcript = transcriptTextarea.value.trim();
        
        if (!transcript) {
            alert('Please enter a medical transcript.');
            return;
        }
        
        processTranscript(transcript);
    });
    
    // Load sample transcript
    sampleBtn.addEventListener('click', function() {
        transcriptTextarea.value = sampleTranscript;
    });
    
    // Clear form
    clearBtn.addEventListener('click', function() {
        transcriptTextarea.value = '';
        hideResults();
    });
    
    // Export as JSON
    exportJsonBtn.addEventListener('click', function() {
        if (lastResult) {
            downloadFile(
                JSON.stringify(lastResult, null, 2),
                'medical_report.json',
                'application/json'
            );
        }
    });
    
    // Export as Text
    exportTxtBtn.addEventListener('click', function() {
        if (lastResult) {
            const report = lastResult.structured_report;
            let textContent = 'MEDICAL REPORT\n\n';
            
            textContent += `Patient Name: ${report.Patient_Name || 'Not specified'}\n\n`;
            
            textContent += 'SYMPTOMS:\n';
            if (report.Symptoms && report.Symptoms.length > 0) {
                report.Symptoms.forEach(symptom => {
                    textContent += `- ${symptom}\n`;
                });
            } else {
                textContent += 'None specified\n';
            }
            textContent += '\n';
            
            textContent += `DIAGNOSIS: ${report.Diagnosis || 'Not specified'}\n\n`;
            
            textContent += 'TREATMENT:\n';
            if (report.Treatment && report.Treatment.length > 0) {
                report.Treatment.forEach(treatment => {
                    textContent += `- ${treatment}\n`;
                });
            } else {
                textContent += 'None specified\n';
            }
            textContent += '\n';
            
            textContent += `CURRENT STATUS: ${report.Current_Status || 'Not specified'}\n\n`;
            textContent += `PROGNOSIS: ${report.Prognosis || 'Not specified'}\n\n`;
            
            textContent += 'IMPORTANT MEDICAL PHRASES:\n';
            if (lastResult.important_medical_phrases && lastResult.important_medical_phrases.length > 0) {
                lastResult.important_medical_phrases.forEach((phrase, index) => {
                    textContent += `${index + 1}. ${phrase}\n`;
                });
            } else {
                textContent += 'None identified\n';
            }
            
            downloadFile(textContent, 'medical_report.txt', 'text/plain');
        }
    });
    
    // Process the transcript
    function processTranscript(transcript) {
        // Show loading
        resultContainer.style.display = 'block';
        loadingIndicator.style.display = 'block';
        resultContent.style.display = 'none';
        resultError.style.display = 'none';
        
        // Send to backend for processing
        fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'transcript': transcript
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store result
            lastResult = data;
            
            // Update UI with results
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            showError();
        });
    }
    
    // Display processing results
    function displayResults(data) {
        // Hide loading, show content
        loadingIndicator.style.display = 'none';
        resultContent.style.display = 'block';
        
        const report = data.structured_report;
        
        // Patient Name
        document.getElementById('patientName').textContent = report.Patient_Name || 'Not specified';
        
        // Symptoms
        const symptomsUl = document.getElementById('symptoms');
        symptomsUl.innerHTML = '';
        if (report.Symptoms && report.Symptoms.length > 0) {
            report.Symptoms.forEach(symptom => {
                const li = document.createElement('li');
                li.textContent = symptom;
                symptomsUl.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'None specified';
            symptomsUl.appendChild(li);
        }
        
        // Diagnosis
        document.getElementById('diagnosis').textContent = report.Diagnosis || 'Not specified';
        
        // Treatment
        const treatmentUl = document.getElementById('treatment');
        treatmentUl.innerHTML = '';
        if (report.Treatment && report.Treatment.length > 0) {
            report.Treatment.forEach(treatment => {
                const li = document.createElement('li');
                li.textContent = treatment;
                treatmentUl.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'None specified';
            treatmentUl.appendChild(li);
        }
        
        // Current Status
        document.getElementById('currentStatus').textContent = report.Current_Status || 'Not specified';
        
        // Prognosis
        document.getElementById('prognosis').textContent = report.Prognosis || 'Not specified';
        
        // Medical Phrases
        const medicalPhrasesUl = document.getElementById('medicalPhrases');
        medicalPhrasesUl.innerHTML = '';
        if (data.important_medical_phrases && data.important_medical_phrases.length > 0) {
            data.important_medical_phrases.forEach(phrase => {
                const li = document.createElement('li');
                li.textContent = phrase;
                medicalPhrasesUl.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'None identified';
            medicalPhrasesUl.appendChild(li);
        }
    }
    
    // Show error message
    function showError() {
        loadingIndicator.style.display = 'none';
        resultContent.style.display = 'none';
        resultError.style.display = 'block';
    }
    
    // Hide all results
    function hideResults() {
        resultContainer.style.display = 'none';
        loadingIndicator.style.display = 'none';
        resultContent.style.display = 'none';
        resultError.style.display = 'none';
        lastResult = null;
    }
    
    // Helper function to download files
    function downloadFile(content, fileName, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }
});