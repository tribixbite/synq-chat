/** @jsx React.createElement */
/** @jsxImportSource react */
import React, { useState } from 'react';

export default function TodoDebug() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Test', completed: false }
  ]);

  return (
    <div className="p-4">
      <h1>Todo Debug</h1>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
} 
