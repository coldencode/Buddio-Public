'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password }),
      });
  
      const data = await response.json();
      console.log(response)
      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      console.log(err)
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/login-bg.png")' }}
    >
      <div className="rounded-2xl shadow-2xl w-full max-w-6xl h-[600px] flex overflow-hidden">
        {/* Left side - GIF */}
        <div className="hidden lg:flex w-1/2 bg-[#edfed8] items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
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

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
          {error && (
            <div className="w-full max-w-md mb-4 p-4 bg-red-50 text-red-500 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <div className="mb-8">
            <Image
              src="/buddio_logo.png"
              alt="Buddio Logo"
              width={300}
              height={150}
              className="object-contain"
            />
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            <div>
              <input
                type="username"
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border-b-2 border-gray-300 focus:border-green-500 bg-[#edfed8] rounded-lg outline-none transition-colors"
              />
            </div>
            
            <div>
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border-b-2 border-gray-300 focus:border-green-500 bg-[#edfed8] rounded-lg outline-none transition-colors"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#edfed8] text-black border border-black rounded-lg hover:bg-[#d7e6c4] transition-colors font-medium"
            >
              Login
            </button>

            <div className="text-center mt-4">
              <a
                href="/signup"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Haven't registered? Sign Up here
              </a>
            </div>
          </form>
        </div>
      </div>
      
      {/* Modified "designed by" section to be part of normal flow */}
      <div className="mt-8 flex items-center justify-center gap-2">
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