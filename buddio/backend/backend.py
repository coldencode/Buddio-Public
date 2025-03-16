import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, storage
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import hashlib
from fastapi.middleware.cors import CORSMiddleware
from enrol import enroll_user
from group_detection import group_detection
from uuid import uuid4
from datetime import datetime
from calculate_collab_score import calculate_collab_score
class Member(BaseModel):
    name: str
    photo: str  # URL or file path to the photo
  
class MemberOutput(Member):
    embedding: list[float]  # Add embedding field

class ProjectData(BaseModel):
    project_name: str
    members: list[Member]

class ProjectOutput(ProjectData):
    members: list[MemberOutput]  # Use the extended output model

class SessionData(BaseModel):
    photo: str
    caption: str
    project_id: str

class ProjectDetailsUpdate(BaseModel):
    project_name: str
    details: str

app = FastAPI() 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

cred = credentials.Certificate("../serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()


# Pydantic model for request validation
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str


# Helper function to hash passwords
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# Register a new user
@app.post("/register")
async def register(user: UserRegister):
    # Check if the username already exists
    user_ref = db.collection("users").document(user.username)
    if user_ref.get().exists:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Hash the password
    hashed_password = hash_password(user.password)

    # Save user to Firestore
    user_ref.set({
        "username": user.username,
        "password": hashed_password,
    })

    return {"message": "User registered successfully"}

# Login a user
@app.post("/login")
async def login(user: UserLogin):
    # Retrieve user from Firestore
    user_ref = db.collection("users").document(user.username)
    user_data = user_ref.get()

    if not user_data.exists:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify the password
    hashed_password = hash_password(user.password)
    if user_data.to_dict()["password"] != hashed_password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful"}

@app.get("/get-projects")
async def get_projects():
    try:
        # Get all projects from Firestore
        projects_ref = db.collection("projects")
        projects = projects_ref.stream()
        
        # Convert projects to list of dictionaries
        projects_list = []
        for project in projects:
            project_data = project.to_dict()
            project_dict = {
                "project_name": project_data["project_name"],
                "members": project_data["members"],
                "created_at": project_data.get("created_at"),
            }
            
            # Only add sessions if they exist
            if "sessions" in project_data:
                project_dict["sessions"] = project_data["sessions"]
            
            projects_list.append(project_dict)
        
        return {"projects": projects_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/create-project")
async def create_project(data:ProjectData):
    # store user facial embeddings in projects collection
    # Parse the incoming JSON data
    member_embeddings = []

    for user in data.members:
        embedding = enroll_user(user.photo)
        member_embeddings.append({
            "name": user.name,
            "photo": user.photo,
            "embedding": embedding
        })
    
    # Create the output object
    output_data = {
        "project_name": data.project_name,
        "members": member_embeddings
    }

    doc_ref = db.collection("projects").document(data.project_name)
    doc_ref.set(output_data)
    
    
    
    return {"message": "Project created successfully"}

@app.post("/update-project-details")
async def update_project_details(data: ProjectDetailsUpdate):
    try:
        # Get reference to the project document
        project_ref = db.collection("projects").document(data.project_name)
        
        # Update the project details
        project_ref.update({
            "details": data.details
        })
        
        return {"message": "Project details updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/capture-group-session")
async def capture_group_session(session: SessionData):
    project_id = session.project_id
    # Decode base64 to bytes
    project_ref = db.collection("projects").document(project_id)
    data = project_ref.get().to_dict()
    enrolled_users = data.get("members", [])
    # detect faces in image and match with enrolled users
    recognized_users = group_detection(enrolled_users, session.photo)
    
    # Create session object
    session_data = {
        "participants": recognized_users,
        "photo_base64": session.photo,
        "timestamp": datetime.now(),
        "caption": session.caption
    }

    # Update project document with new session
    project_ref.update({
        "sessions": firestore.ArrayUnion([session_data])
    })
    
    return {
        "status": "success",
        "session": session_data,
        "project_id": project_id
    }

@app.get("/leaderboard/{project_id}")
async def get_leaderboard(project_id: str):
    try:
        # Get the project document
        project_ref = db.collection("projects").document(project_id)
        project_data = project_ref.get()
        
        if not project_data.exists:
            raise HTTPException(status_code=404, detail="Project not found")
            
        project_dict = project_data.to_dict()
        sessions = project_dict.get("sessions", [])
        
        # Calculate appearances for each participant
        appearances = {}
        for session in sessions:
            participants = session.get("participants", [])
            for participant in participants:
                # Handle both dictionary and string participant formats
                if isinstance(participant, dict):
                    name = participant.get("name")
                else:
                    name = participant  # If participant is directly a string
                
                if name:
                    if name not in appearances:
                        appearances[name] = {
                            "count": 1,
                            "photo": None
                        }
                    else:
                        appearances[name]["count"] += 1
        
        # Add participant photos from project members
        members = project_dict.get("members", [])
        for member in members:
            if isinstance(member, dict) and "name" in member:
                name = member["name"]
                if name in appearances:
                    appearances[name]["photo"] = member.get("photo")
        
        # Convert to sorted list
        leaderboard = [
            {
                "name": name,
                "count": data["count"],
                "photo": data["photo"]
            }
            for name, data in appearances.items()
        ]
        
        # Sort by count in descending order
        leaderboard.sort(key=lambda x: x["count"], reverse=True)
        
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/social-graph")
async def generate_graph_data(project_id):
    try:
        project_ref = db.collection("projects").document(project_id)
        project_data = project_ref.get().to_dict()
        sessions = project_data.get("sessions", [])
        
        # Calculate collaboration scores
        scores = calculate_collab_score(sessions)
        
        # Generate nodes and links
        participants = {p for s in sessions for p in s["participants"]}
        nodes = [{"id": p} for p in participants]
        links = [
            {"source": pair[0], "target": pair[1], "value": score}
            for pair, score in scores.items()
        ]
        
        return {"nodes": nodes, "links": links}
    except Exception as e:
        print(f"Error generating graph: {e}")
        return {"nodes": [], "links": []}  # Return empty data on error
 