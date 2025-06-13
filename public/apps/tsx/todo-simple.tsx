/** @jsx React.createElement */
/** @jsxImportSource react */
import React, { useState } from 'react';

export default function SimpleTodo() {
  const [todos, setTodos] = useState(['Test todo 1', 'Test todo 2']);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input.trim()]);
      setInput('');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Simple Todo</h1>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
          placeholder="Add todo..."
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add
        </button>
      </div>
      
      <ul className="space-y-2">
        {todos.map((todo, index) => (
          <li key={index} className="p-2 bg-gray-100 rounded">
            {todo}
          </li>
        ))}
      </ul>
    </div>
  );
} 
