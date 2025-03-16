'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Webcam from 'react-webcam';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CollaborationGraph from './CollaborationGraph';
export default function ProjectPage({ params }) {
  const projectName = use(params).projectName;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [caption, setCaption] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [projectDetails, setProjectDetails] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const webcamRef = useRef(null);
  const router = useRouter();
  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "user"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project data
        const projectResponse = await fetch('http://localhost:8000/get-projects');
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch projects');
        }
        const projectData = await projectResponse.json();
        const currentProject = projectData.projects.find(p => p.project_name === decodeURIComponent(projectName));
        
        if (!currentProject) {
          throw new Error('Project not found');
        }
        
        setProject(currentProject);
        console.log(currentProject)
        console.log(project);

        // Fetch leaderboard data
        const encodedProjectName = encodeURIComponent(decodeURIComponent(projectName));
        const leaderboardResponse = await fetch(`http://localhost:8000/leaderboard/${encodedProjectName}`);
        if (!leaderboardResponse.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.leaderboard);
        
        // Fetch graph data
        const graphResponse = await fetch(`http://localhost:8000/social-graph?project_id=${encodedProjectName}`);
        const graphData = await graphResponse.json();
        setGraphData(graphData);
      

        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
          setLoadingLeaderboard(false);
        }

        
    };

    fetchData();
  }, [projectName]);

  const capture = useCallback(() => {
    
    const imageSrc = webcamRef.current.getScreenshot();
    const base64 = imageSrc.split(',')[1];

    setCapturedImage({
      base64: base64,
      url: imageSrc // Keep data URL for preview
    });
    // fetch(imageSrc)
    //   .then(res => res.blob())
    //   .then(blob => {
    //     setCapturedImage({
    //       blob,
    //       url: URL.createObjectURL(blob)
    //     });
    //     setShowCamera(false);
    //   });
    setShowCamera(false);
  }, []);

  const handleSubmit = async () => {
    try{
      const jsonData = {
      project_id: decodeURIComponent(projectName),
      caption: caption,
      photo: capturedImage.base64
    };
      console.log(jsonData);
      const jsonString = JSON.stringify(jsonData, null, 2); 
      const response = await fetch('http://localhost:8000/capture-group-session', {
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
      console.error('Error capturing group session', error);
      alert('Failed to capture group. Please try again.');
    }

    // Will implement backend integration later
    setShowCaptureModal(false);
    setCapturedImage(null);
    setCaption('');
    setShowCamera(false);
  };

  const handleSaveDetails = async () => {
    try {
      const response = await fetch('http://localhost:8000/update-project-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: decodeURIComponent(projectName),
          details: projectDetails
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update project details');
      }

      // Update the local project state with the new details
      setProject(prev => ({
        ...prev,
        details: projectDetails
      }));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating project details:', err);
      alert('Failed to save project details. Please try again.');
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
        <Link href={`/project/${projectName}/calendar`} className="mb-4">
          <div className="w-12 h-12 bg-[#f1faf2] rounded-full flex items-center justify-center shadow-sm hover:bg-[#d7ecd9] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </Link>
        <Link href={`/project/${projectName}/bill-splitter`} className="mb-4">
          <div className="w-12 h-12 bg-[#f1faf2] rounded-full flex items-center justify-center shadow-sm hover:bg-[#d7ecd9] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Link>

      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 bg-[#e8f5e9] -mx-8 -mt-8 px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <div className="w-10 h-10 bg-[#f1faf2] rounded-full flex items-center justify-center hover:bg-[#d7ecd9] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl font-semibold">{decodeURIComponent(projectName)}</h1>
          </div>
          
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

        {/* Project Content */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#f1faf2] rounded-lg p-6">
            {/* Top Grid: Project Info and Team Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Project Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Project Information</h2>
                  <div className="bg-white rounded-lg p-4">
                    {loading ? (
                      <p className="text-gray-600">Loading project details...</p>
                    ) : error ? (
                      <p className="text-red-500">{error}</p>
                    ) : (
                      <div className="space-y-4">
                        {isEditing ? (
                          <>
                            <textarea
                              value={projectDetails}
                              onChange={(e) => setProjectDetails(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              rows={6}
                              placeholder="Enter project details..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveDetails}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setProjectDetails(project.details || '');
                                }}
                                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-700">
                              {projectDetails || 'No project details available.'}
                            </p>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="text-green-500 hover:text-green-600 transition-colors"
                            >
                              {projectDetails ? 'Edit Details' : 'Add Details'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Capture Moment Button */}
                <button 
                  onClick={() => setShowCaptureModal(true)}
                  className="w-full px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                >
                  Capture the moment here
                </button>
              </div>

              {/* Right Column - Team Members */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Team Members</h2>
                <div className="bg-white rounded-lg p-4">
                  {loading ? (
                    <p className="text-gray-600">Loading team members...</p>
                  ) : error ? (
                    <p className="text-red-500">{error}</p>
                  ) : project?.members && project.members.length > 0 ? (
                    <div className="space-y-3">
                      {project.members.map((member, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full overflow-hidden">
                            {member.photo ? (
                              <Image
                                src={`data:image/jpeg;base64,${member.photo}`}
                                alt={member.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-green-700 font-medium">
                                {member.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-700">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No team members found</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Session Timeline</h2>
              <div className="bg-white rounded-lg p-6 overflow-x-auto">
                {project?.sessions && project.sessions.length > 0 ? (
                  <div className="relative min-w-max">
                    {/* Horizontal line */}
                    <div className="absolute left-0 right-0 top-4 h-0.5 bg-green-200" />
                    
                    {/* Timeline items */}
                    <div className="flex gap-8">
                      {[...project.sessions].reverse().map((session, index) => (
                        <div key={index} className="relative pt-8">
                          {/* Timeline dot */}
                          <div className="absolute top-[14px] left-1/2 w-3 h-3 rounded-full bg-green-500 transform -translate-x-1.5" />
                          
                          {/* Content */}
                          <div className="w-80">
                            <div className="bg-[#f1faf2] rounded-lg p-4 shadow-sm">
                              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mb-3">
                                <Image
                                  src={`data:image/jpeg;base64,${session.photo_base64}`}
                                  alt={`Session ${index + 1}`}
                                  width={320}
                                  height={180}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <p className="text-gray-700 mb-2">{session.caption}</p>
                              <div className="space-y-2">
                                <span className="block text-sm text-gray-500">
                                  {new Date(session.timestamp).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">Participants:</span>
                                  <div className="flex -space-x-2">
                                    {session.participants.map((participant, pIndex) => (
                                      <div
                                        key={pIndex}
                                        className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center overflow-hidden"
                                        title={participant.name}
                                      >
                                        {participant.photo ? (
                                          <Image
                                            src={`data:image/jpeg;base64,${participant.photo}`}
                                            alt={participant.name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-sm font-medium text-green-700">
                                            {participant.charAt(0)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No sessions recorded yet. Click "Capture the moment" to create your first session!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Grid: Leaderboard and Collaboration Network */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Leaderboard */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Attendance Leaderboard</h2>
                <div className="bg-white rounded-lg p-4">
                  {loadingLeaderboard ? (
                    <p className="text-gray-600">Loading leaderboard...</p>
                  ) : error ? (
                    <p className="text-red-500">{error}</p>
                  ) : leaderboard.length > 0 ? (
                    <div className="space-y-4">
                      {leaderboard.map((entry, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full overflow-hidden">
                            {entry.photo ? (
                              <Image
                                src={`data:image/jpeg;base64,${entry.photo}`}
                                alt={entry.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-green-700 font-medium">
                                {entry.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium text-gray-700">{entry.name}</p>
                            <p className="text-sm text-gray-500">{entry.count} appearances</p>
                          </div>
                          {index === 0 && (
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
                                </svg>
                                Leader
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No attendance records yet</p>
                  )}
                </div>
              </div>

              {/* Collaboration Network */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Collaboration Network</h2>
                <div className="bg-white rounded-lg p-4 h-[400px] relative w-full">
                  <div className="absolute inset-0 p-4">
                    <CollaborationGraph data={graphData}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Capture a Moment</h2>
              <button 
                onClick={() => {
                  setShowCaptureModal(false);
                  setCapturedImage(null);
                  setCaption('');
                  setShowCamera(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
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
                  <button
                    onClick={capture}
                    className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Take Photo
                  </button>
                </div>
              ) : capturedImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <Image
                      src={capturedImage.url}
                      alt="Captured moment"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowCamera(true);
                      setCapturedImage(null);
                    }}
                    className="w-full p-3 border-2 border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Open Camera
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Write a caption for this moment..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!capturedImage || !caption.trim()}
                className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 