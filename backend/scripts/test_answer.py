import httpx
import json

def test():
    # Session and Interview IDs from the previous output
    session_id = "406b62e6-dfdc-4a63-aecf-deafe1f27a92"
    interview_id = "4b46e551-c858-4d6d-8a06-5837d9e1896f"
    
    payload = {
        "session_id": session_id,
        "interview_id": interview_id,
        "question_id": "t1",
        "answer": "I chose a custom CNN architecture consisting of 3 convolutional layers followed by max pooling and 2 dense layers. I used ReLU activations and batch normalization to accelerate convergence. It was suitable because the crop images had simple disease leaf spots which did not require a very deep network like ResNet50, thus keeping the parameters small and preventing overfitting on our small dataset."
    }
    
    # 1. Test answer endpoint
    print("Testing /api/interview/answer...")
    response = httpx.post("http://127.0.0.1:8000/api/interview/answer", json=payload, timeout=20.0)
    print("Response Status:", response.status_code)
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
    
    # 2. Test export dossier endpoint
    print("\nTesting /api/export/dossier/{session_id}...")
    export_response = httpx.get(f"http://127.0.0.1:8000/api/export/dossier/{session_id}", timeout=20.0)
    print("Export Status Code:", export_response.status_code)
    print("PDF Content Type:", export_response.headers.get("content-type"))
    print("Content Length:", len(export_response.content), "bytes")
    
    # Write the bytes to verify it's a valid PDF
    with open("test_dossier.pdf", "wb") as f:
        f.write(export_response.content)
    print("Saved test_dossier.pdf successfully!")

if __name__ == "__main__":
    test()
