'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';

// Define the structure of our class data
interface ClassDetails {
  className: string;
  classNumber: string;
  title: string;
  status: 'OPEN' | 'FULL';
  seats: string;
  instructor: string;
  schedule: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001';

export default function HomePage() {
  // Data State
  const [trackedClasses, setTrackedClasses] = useState<ClassDetails[]>([]);
  const [searchResults, setSearchResults] = useState<ClassDetails[]>([]);
  
  // Settings State
  const [term, setTerm] = useState('');
  const [termName, setTermName] = useState('');
  const [termInput, setTermInput] = useState('');
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [ntfyTopicInput, setNtfyTopicInput] = useState('');

  // UI State
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // --- API Functions ---
  const fetchBackendState = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/state`);
      if (!res.ok) throw new Error('Failed to connect to backend');
      const data = await res.json();
      
      setTerm(data.settings.term);
      setTermInput(data.settings.term);
      setTermName(data.settings.termName);
      setNtfyTopic(data.settings.ntfyTopic);
      setNtfyTopicInput(data.settings.ntfyTopic);
      setTrackedClasses(data.trackedClasses);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch and periodic refresh
  useEffect(() => {
    fetchBackendState();
    const interval = setInterval(fetchBackendState, 30 * 1000); // Refresh UI data every 30 seconds
    return () => clearInterval(interval);
  }, [fetchBackendState]);

  const handleSettingsUpdate = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: termInput, ntfyTopic: ntfyTopicInput }),
    });
    const data = await res.json();
    setTermName(data.termName);
    setTerm(termInput);
    setNtfyTopic(ntfyTopicInput);
    if (data.termChanged) {
      setTrackedClasses([]);
      setSearchResults([]);
      setSearchInput('');
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/api/search/${searchInput.trim()}`);
      if (!res.ok) throw new Error('Search failed');
      const data: ClassDetails[] = await res.json();
      if (data.length === 0 || (data[0] as any).error) {
        setError( (data[0] as any).error || 'No classes found. Check the term or class name.');
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (err) {
      setError('Failed to perform search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddClass = async (classToAdd: ClassDetails) => {
    const res = await fetch(`${API_URL}/api/tracked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classToAdd),
    });
    const updatedTrackedList: ClassDetails[] = await res.json();
    setTrackedClasses(updatedTrackedList);
  };
  
  const handleRemoveClass = async (classNumberToRemove: string) => {
    const res = await fetch(`${API_URL}/api/tracked/${classNumberToRemove}`, {
      method: 'DELETE',
    });
    const updatedTrackedList: ClassDetails[] = await res.json();
    setTrackedClasses(updatedTrackedList);
  };
  
  const isClassTracked = (classNumber: string) => trackedClasses.some(c => c.classNumber === classNumber);
  const uniqueClassNamesInTracking = [...new Set(trackedClasses.map(c => c.className))];

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 flex justify-center p-4">
      <main className="w-full max-w-5xl">
        <header className="text-center my-12">
          <h1 className="text-5xl font-extrabold text-gray-900">ASU Class Tracker</h1>
          <p className="text-gray-600 mt-2 text-lg">Real-time seat availability checker.</p>
        </header>

        {/* Settings & Search Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
          <form onSubmit={handleSettingsUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
              <div className="md:col-span-1">
                  <label htmlFor="term" className="block text-sm font-bold text-gray-700 mb-1">ASU Term Code</label>
                  <input id="term" type="text" value={termInput} onChange={(e) => setTermInput(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
              </div>
              <div className="md:col-span-1">
                  <label htmlFor="ntfy" className="block text-sm font-bold text-gray-700 mb-1">ntfy.sh Topic</label>
                  <input id="ntfy" type="text" value={ntfyTopicInput} onChange={(e) => setNtfyTopicInput(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg"/>
              </div>
              <button type="submit" className="bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-700 h-full">Save Settings</button>
          </form>
          <hr className="my-4"/>
          <form onSubmit={handleSearch} className="flex items-end gap-4">
               <div className="flex-grow">
                  <label htmlFor="search" className="block text-sm font-bold text-gray-700 mb-1">Class Name</label>
                  <input id="search" type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="e.g., CSE 476" className="w-full p-3 border border-gray-300 rounded-lg"/>
               </div>
               <button type="submit" disabled={isSearching} className="bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 disabled:bg-gray-400">
                  {isSearching ? '...' : 'Search'}
               </button>
          </form>
        </div>
        
        {searchResults.length > 0 && (
            <div className="max-w-4xl mx-auto mt-4 bg-white rounded-xl shadow-lg p-4">
                <h3 className="font-bold text-lg mb-2">Select a class section to track:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map(c => (
                        <div key={c.classNumber} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100">
                            <div>
                                <span className="font-semibold">{c.classNumber}</span> - <span className="text-gray-600">{c.instructor} ({c.schedule})</span>
                            </div>
                            <button 
                                onClick={() => handleAddClass(c)} 
                                disabled={isClassTracked(c.classNumber)}
                                className="bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {isClassTracked(c.classNumber) ? 'Tracking' : 'Track'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {error && <p className="text-red-500 text-center mt-4 bg-red-100 p-3 rounded-lg max-w-4xl mx-auto">{error}</p>}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1">
            <h2 className="text-3xl font-bold mb-4">Tracking List</h2>
            <div className="space-y-3">
              {uniqueClassNamesInTracking.length > 0 ? uniqueClassNamesInTracking.map(className => (
                <div key={className} className="bg-white p-4 rounded-xl shadow-md">
                  <p className="font-bold text-lg">{className}</p>
                   {trackedClasses.filter(c => c.className === className).map(c => (
                       <div key={c.classNumber} className="flex justify-between items-center mt-2 pl-2">
                           <span className="text-gray-600">{c.classNumber}</span>
                           <button onClick={() => handleRemoveClass(c.classNumber)} className="text-red-500 hover:text-red-700 font-semibold text-sm">
                               Remove
                           </button>
                       </div>
                   ))}
                </div>
              )) : ( <p className="text-gray-500">No classes are being tracked.</p> )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold">Live Status</h2>
              <span className="font-semibold text-gray-600 bg-white px-3 py-1 rounded-lg shadow-sm">{termName}</span>
            </div>
            <div className="space-y-4">
              {isLoading && trackedClasses.length === 0 ? <p className="text-gray-500">Loading...</p> :
              trackedClasses.length > 0 ? trackedClasses.map(c => (
                <div key={c.classNumber} className="bg-white p-4 rounded-xl shadow-md border-l-4" style={{ borderColor: c.status === 'OPEN' ? '#10B981' : '#EF4444' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{c.className} <span className="text-gray-500 font-normal">({c.classNumber})</span></p>
                      <p className="text-gray-600">{c.title}</p>
                    </div>
                    <span className={`font-bold py-1 px-3 rounded-full text-xs uppercase ${c.status === 'OPEN' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                      <p><strong>Seats:</strong> {c.seats}</p>
                      <p className="sm:col-span-2"><strong>Instructor:</strong> {c.instructor}</p>
                      <p className="sm:col-span-3"><strong>Schedule:</strong> {c.schedule}</p>
                  </div>
                </div>
              )) : ( <p className="text-gray-500">Add a class to see its status.</p> )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}