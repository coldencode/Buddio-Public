'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:8000/get-projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data.projects);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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
           <h1 className="text-2xl font-semibold text-green-700">Dashboard</h1>
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

        {/* Content Wrapper */}
        <div className="flex gap-8">
          {/* Left Content */}
          <div className="flex-1">
            {/* Welcome Back Banner */}
            <div className="bg-gradient-to-r from-[#B3E5B3] to-[#D7F4D7] rounded-2xl p-8 mb-8 relative overflow-hidden">
              {/* Welcome Text */}
              <div className="relative z-10 mr-48">
                <h2 className="text-4xl font-bold text-white mb-2">Welcome back!</h2>
                <p className="text-white/80">Always stay updated in your project portal</p>
              </div>
              
              {/* White Box Image */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-60 h-60">
                <Image
                  src="/white_box.png"
                  alt="Decorative Flower"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>

            {/* Projects Title */}
            <div className="max-w-6xl mx-auto mb-6">
              <h2 className="text-2xl font-semibold text-green-700 mb-2">Projects</h2>
              <hr className="border-t-2 border-green-100" />
            </div>

            {/* Search Bar */}
            <div className="max-w-6xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500 pl-12"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="max-w-6xl mx-auto">
              {error && (
                <div className="text-red-500 mb-4">
                  Error loading projects: {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* New Project Card */}
                <Link href="/new_project">
                  <div className="w-48 h-48 bg-[#f1faf2] rounded-lg flex flex-col items-center justify-center hover:bg-[#e8f5e9] transition-colors cursor-pointer border-2 border-dashed border-green-300 hover:border-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-green-600 font-medium">Create New Project</span>
                  </div>
                </Link>

                {/* Existing Projects */}
                {loading ? (
                  <div className="w-48 h-48 bg-[#f1faf2] rounded-lg flex items-center justify-center">
                    <span className="text-green-600">Loading projects...</span>
                  </div>
                ) : (
                  filteredProjects.map((project, index) => (
                    <Link key={index} href={`/project/${encodeURIComponent(project.project_name)}`}>
                      <div className="w-48 h-48 bg-[#f1faf2] rounded-lg p-4 hover:bg-[#e8f5e9] transition-colors cursor-pointer">
                        <h3 className="text-lg font-semibold mb-2 text-green-700 truncate">{project.project_name}</h3>
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">{project.members.length} members</p>
                          <div className="flex -space-x-2 mb-2">
                            {project.members.slice(0, 3).map((member, idx) => (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center overflow-hidden"
                                title={member.name}
                              >
                                {member.photo ? (
                                  <Image
                                    src={`data:image/jpeg;base64,${member.photo}`}
                                    alt={member.name}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-green-700">
                                    {member.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                            ))}
                            {project.members.length > 3 && (
                              <div
                                className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center"
                                title="More members"
                              >
                                <span className="text-sm font-medium text-green-700">
                                  +{project.members.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5 overflow-hidden">
                            {project.members.slice(0, 2).map((member, idx) => (
                              <p key={idx} className="truncate text-xs text-gray-600">
                                {member.name}
                              </p>
                            ))}
                            {project.members.length > 2 && (
                              <p className="text-xs text-gray-500">
                                and {project.members.length - 2} more
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Advertisement */}
          <div className="hidden xl:block w-80">
            <div className="bg-[#001525] rounded-2xl p-6 sticky top-8">
              <a href="https://www.logitechg.com/en-ph/products/gaming-mice/g304-lightspeed-wireless-gaming-mouse.html" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="block"
              >
                <Image
                  src="/logitech-ad.jpg"
                  alt="Logitech G304 Gaming Mouse"
                  width={300}
                  height={600}
                  className="rounded-xl"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}