# test.py
import cv2
import json
import numpy as np
import base64
from deepface import DeepFace
from sklearn.metrics.pairwise import cosine_similarity

def group_detection(users, photo_base64):

    # Decode base64 to bytes
    img_bytes = base64.b64decode(photo_base64)
    # Load image  
    # Convert bytes to numpy array (for OpenCV processing)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Detect faces with error handling
    try:
        faces = DeepFace.extract_faces(frame, detector_backend="mtcnn", enforce_detection=True)
    except ValueError:
        print("No face detected. Ensure your face is visible and well-lit.")
        exit()
    # Match each face to enrolled users
    recognized_users = []

    for face in faces:
        # Get face coordinates from the ORIGINAL image dimensions
        x, y, w, h = (
            face["facial_area"]["x"],
            face["facial_area"]["y"],
            face["facial_area"]["w"],
            face["facial_area"]["h"],
        )
        face_img = frame[y:y+h, x:x+w]

        # Generate embedding for the detected face
        result = DeepFace.represent(face_img, model_name="Facenet")
        test_embedding = result[0]["embedding"]  # Ensure this is a list

        # Compare with all enrolled users
        best_match = None
        highest_similarity = 0
        for user in users:
            if user["name"] in [u for u in recognized_users]:
                continue    # Skip if already recognized
            similarity = cosine_similarity([user["embedding"]], [test_embedding])[0][0]
            if similarity > highest_similarity and similarity > 0.6:  # Threshold
                highest_similarity = similarity
                best_match = user

        # Add result
        if best_match:
            recognized_users.append(best_match["name"])
            # recognized_users.append({
            #     "name": best_match["name"],
            #     "similarity": round(highest_similarity, 2)
            # })
            # Draw box and label
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"{best_match['name']} ({highest_similarity:.2f})", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        else:
            # Draw "Unknown" label
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
            cv2.putText(frame, "Unknown", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    # Show/Save the FULL annotated image
    cv2.imwrite("group-output.jpg", frame)
    return recognized_users