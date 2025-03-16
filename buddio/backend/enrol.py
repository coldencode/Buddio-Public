import cv2
from deepface import DeepFace
import base64
import numpy as np

def enroll_user(photo_base64):

    # Decode base64 to bytes
    img_bytes = base64.b64decode(photo_base64)
    # Load image  
    # Convert bytes to numpy array (for OpenCV processing)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
  

    # Generate embedding
    result = DeepFace.represent(frame, model_name="Facenet")
    embedding = result[0]["embedding"]

    
    return embedding

