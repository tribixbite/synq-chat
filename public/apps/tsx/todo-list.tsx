/** @jsx React.createElement */
/** @jsxImportSource react */
import React, { useState } from 'react';

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Try this TSX todo app', completed: false },
    { id: 2, text: 'Built with React hooks', completed: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false
      }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <h1 className="text-3xl font-bold text-center">Todo App</h1>
          <p className="text-center text-purple-100 mt-2">
            React TSX • Compiled with Bun
          </p>
        </div>

        {/* Add Todo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
            <button
              onClick={addTodo}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' 
                ? 'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize bg-purple-100 text-purple-700'
                : 'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize text-gray-600 hover:bg-gray-100'
              }
            >
              all
            </button>
            <button
              onClick={() => setFilter('active')}
              className={filter === 'active' 
                ? 'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize bg-purple-100 text-purple-700'
                : 'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize text-gray-600 hover:bg-gray-100'
              }
            >
              active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={filter === 'completed' 
                ? 'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize bg-purple-100 text-purple-700'
                : 'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize text-gray-600 hover:bg-gray-100'
              }
            >
              completed
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredTodos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No todos {filter === 'all' ? 'yet' : 'in ' + filter}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTodos.map(todo => (
                <li key={todo.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={todo.completed
                        ? 'flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all bg-green-500 border-green-500 text-white'
                        : 'flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all border-gray-300 hover:border-green-400'
                      }
                    >
                      {todo.completed && (
                        <svg className="w-4 h-4 m-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={todo.completed
                        ? 'flex-1 transition-all text-gray-500 line-through'
                        : 'flex-1 transition-all text-gray-800'
                      }
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {activeCount} item{activeCount !== 1 ? 's' : ''} left
            </span>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            TSX compiled dynamically by Bun
          </div>
        </div>
      </div>
    </div>
  );
}
