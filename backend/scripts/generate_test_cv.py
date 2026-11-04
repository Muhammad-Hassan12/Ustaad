from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_test_cv():
    filename = "test_cv.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    
    # Title / Name
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, 750, "Arslan Ahmed")
    
    # Contact Info
    c.setFont("Helvetica", 10)
    c.drawString(50, 735, "Email: arslan.ahmed@example.com | Phone: +92 300 1234567 | Location: Karachi, Pakistan")
    
    # Target / Objective
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 700, "Professional Summary")
    c.setFont("Helvetica", 10)
    c.drawString(50, 685, "Ambitious Software Engineer with 1+ years of experience building machine learning models")
    c.drawString(50, 670, "and web applications. Seeking a role as a Machine Learning Engineer in Karachi.")
    
    # Skills
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 640, "Core Skills")
    c.setFont("Helvetica", 10)
    c.drawString(50, 625, "Programming: Python, SQL, JavaScript, C++")
    c.drawString(50, 610, "Libraries & Frameworks: PyTorch, TensorFlow, FastAPI, React, Next.js, Scikit-Learn")
    c.drawString(50, 595, "Tools: Git, Docker, Supabase, Google Cloud Platform (GCP)")
    
    # Education
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 560, "Education")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 545, "Bachelor of Science in Computer Science")
    c.setFont("Helvetica", 10)
    c.drawString(50, 530, "FAST NUCES, Karachi, Pakistan | Graduation Year: 2025")
    
    # Experience
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 495, "Professional Experience")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 480, "Junior AI Engineer - TechSoft Karachi (2025 - Present)")
    c.setFont("Helvetica", 10)
    c.drawString(50, 465, "- Built and deployed computer vision models using PyTorch on GCP.")
    c.drawString(50, 450, "- Optimized image preprocessing pipelines, reducing inference latency by 20%.")
    
    # Projects
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 415, "Projects")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, 400, "Smart Crop Health Monitor")
    c.setFont("Helvetica", 10)
    c.drawString(50, 385, "Developed a mobile-friendly web app using React and FastAPI. Used PyTorch to train a CNN")
    c.drawString(50, 370, "for detecting crop diseases. Deployed backend on FastAPI and database on Supabase.")
    
    c.save()
    print(f"Created {filename} successfully!")

if __name__ == "__main__":
    create_test_cv()
