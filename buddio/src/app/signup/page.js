'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Call the FastAPI backend to register the user
      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the login page after successful registration
        router.push('/login');
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
         style={{ backgroundImage: 'url("/login-bg.png")' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-6xl h-[600px] flex overflow-hidden">
        {/* Left side - GIF */}
        <div className="w-1/2 bg-[#edfed8] p-12 flex flex-col justify-center items-center">
          <div className="relative w-full h-full">
            <Image
              src="/login-animation.gif"
              alt="Login Animation"
              width={500}
              height={500}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Right side - Sign Up Form */}
        <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
          {/* Buddio Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/buddio_logo.png"
              alt="Buddio Logo"
              width={300}
              height={150}
              className="object-contain"
              priority
            />
          </div>

          <h2 className="text-3xl font-bold mb-8 text-gray-800">Create Account</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border-b-2 border-green-300 bg-transparent focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border-b-2 border-green-300 bg-transparent focus:outline-none focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#edfed8] text-gray-800 py-3 rounded-lg hover:bg-[#e0f5c3] transition-colors font-medium"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
      
      {/* Modified "designed by" section in normal flow */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <span className="text-white">designed by</span>
        <Image
          src="/bud.png"
          alt="Quantifiers Logo"
          width={30}
          height={30}
          className="object-contain"
        />
        <span className="text-white font-bold">Quantifiers</span>
      </div>
    </div>
  );
}