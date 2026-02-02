import React from 'react';

const SampleHome = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Tailwind CSS Tester</h1>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Welcome to the Test Page</h2>
          <p className="text-gray-600 text-lg">This is a simple template to test Tailwind CSS classes.</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">Card 1</h3>
            <p className="text-gray-600">Test card with hover effects and responsive grid.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-green-600">Card 2</h3>
            <p className="text-gray-600">Another test card to check spacing and colors.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-purple-600">Card 3</h3>
            <p className="text-gray-600">Third card for testing grid layout responsiveness.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors">
            Primary Button
          </button>
          <button className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors">
            Secondary Button
          </button>
          <button className="border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-6 py-2 rounded-md transition-all">
            Outline Button
          </button>
        </div>

        {/* Form Example */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Form Elements Test</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Test input field"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <textarea 
              placeholder="Test textarea"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24"
            />
            <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option>Select option 1</option>
              <option>Select option 2</option>
              <option>Select option 3</option>
            </select>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; 2026 Tailwind CSS Test Page</p>
        </div>
      </footer>
    </div>
  );
};

export default SampleHome;