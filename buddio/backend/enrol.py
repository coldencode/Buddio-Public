import cv2
from deepface import DeepFace
import base64
import numpy as np
from preprocess_image import enhance_contrast

def enroll_user(photo_base64):

    # Decode base64 to bytes
    img_bytes = base64.b64decode(photo_base64)
    # Load image  
    # Convert bytes to numpy array (for OpenCV processing)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # Detect faces using MTCNN (automatically aligns faces)
    try:
        faces = DeepFace.extract_faces(
            frame, 
            detector_backend="mtcnn", 
            enforce_detection=True
        )
    except ValueError:
        print("No face detected. Ensure your face is visible and well-lit.")
        return None
    
    # Ensure exactly one face for enrollment
    if len(faces) != 1:
        print("Registration requires exactly one face.")
        return None
    
    # Extract face region of interest (ROI)
    face = faces[0]
    x, y, w, h = (
        face["facial_area"]["x"],
        face["facial_area"]["y"],
        face["facial_area"]["w"],
        face["facial_area"]["h"],
    )
    face_img = frame[y:y+h, x:x+w]
    
    # Preprocess the face (alignment + contrast enhancement)
    preprocessed_face = enhance_contrast(face_img)
    
    # Generate embedding from preprocessed face
    result = DeepFace.represent(
        preprocessed_face,
        model_name="Facenet",
        enforce_detection=False  # Already detected
    )
    embedding = result[0]["embedding"]
    
    return embedding

    

