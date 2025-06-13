import React from 'react';

export default function SimpleTest() {
  return (
    <div className="p-8 bg-blue-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">
          Simple Test Component
        </h1>
        <p className="text-gray-600 mb-4">
          This is a simple React component to test JSX compilation.
        </p>
        <button 
          onClick={() => alert('Button clicked!')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Click Me
        </button>
      </div>
    </div>
  );
} 
