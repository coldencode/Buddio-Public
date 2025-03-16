'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';



export default function NewProject() {
  const [projectName, setProjectName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);
  const router = useRouter();

  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user"
  };

  const handleAddMember = () => {
    if (memberName.trim()) {
      setShowCamera(true);
    }
  };

  const capture = useCallback(() => {
    if (!memberName.trim()) {
      alert("Please enter a member name first");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    // Convert base64 to blob

    const base64 = imageSrc.split(',')[1];

    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const newMember = {
          name: memberName.trim(),
          photo: base64,
          photoUrl: imageSrc // URL.createObjectURL(blob)
        };
        
        setMembers(prev => [...prev, newMember]);
        setMemberName('');
        setShowCamera(false);
      });
  }, [memberName]);

  const removeMember = (index) => {
    setMembers(prev => {
      const newMembers = [...prev];
      const removed = newMembers.splice(index, 1)[0];
      URL.revokeObjectURL(removed.photoUrl);
      return newMembers;
    });
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    if (members.length === 0) {
      alert("Please add at least one member");
      return;
    }
    
    try {
      const jsonData = {
        project_name: projectName,
        members: members.map(member => ({
          name: member.name,
          photo: member.photo
        }))
      };
      console.log(jsonData);
      const jsonString = JSON.stringify(jsonData, null, 2); // The `null, 2` arguments format the JSON for readability.
      const response = await fetch('http://localhost:8000/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' 
        },
        body: jsonString,
      });

      if (!response.ok) {
        console.log(response);
        throw new Error('Failed to create project');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please ensure your face is in the frame.');
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-20 bg-[#e8f5e9] p-4 flex flex-col items-center">
        <Link href="/dashboard" className="mb-8">
          <div className="w-12 h-12 bg-[#f1faf2] rounded-full flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-12 bg-[#e8f5e9] -mx-8 -mt-8 px-8 py-4">
          <Link href="/dashboard">
            <div className="w-10 h-10 bg-[#f1faf2] rounded-full flex items-center justify-center hover:bg-[#d7ecd9] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </Link>
          
          {/* Added Buddio Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Image
              src="/buddio_logo.png"
              alt="Buddio Logo"
              width={150}
              height={75}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Project Details */}
            <div className="space-y-6">
              <input
                type="text"
                placeholder="Project name"
                className="w-full p-3 border-b-2 border-green-300 bg-transparent focus:outline-none focus:border-green-500"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />

              <div className="bg-[#e8f5e9] p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Add members</h3>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="w-full p-3 border-b-2 border-green-300 bg-transparent focus:outline-none focus:border-green-500 mb-4"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                />
                
                {showCamera ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={capture}
                        className="flex-1 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Capture Photo
                      </button>
                      <button
                        onClick={() => setShowCamera(false)}
                        className="flex-1 p-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAddMember}
                    disabled={!memberName.trim()}
                    className="w-full p-3 border-2 border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Take photo
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Members List */}
            <div className="bg-[#e8f5e9] p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Members</h3>
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div key={index} className="p-2 bg-[#f1faf2] rounded flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 relative rounded-full overflow-hidden">
                        <Image
                          src={member.photoUrl}
                          alt={member.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>{member.name}</span>
                    </div>
                    <button
                      onClick={() => removeMember(index)}
                      className="text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Create Project Button */}
          <div className="mt-12 flex justify-end">
            <button
              onClick={handleCreateProject}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Create project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 