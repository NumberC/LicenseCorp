// frontend/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { createTask, getTasks, updateTask } from './app';

interface TodoItem {
  id: string;
  description: string;
  complete: boolean;
}

export default function Home() {
  const [todos, setTodos] = useState<TodoItem[]>([
  ]);

  const generateUUID = () => {
    if (crypto.randomUUID) {
      return crypto.randomUUID(); // Use browser's native randomUUID if available
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const fetchTodos = async () => {
    try {
      const data: Record<string, [string, boolean]> = await getTasks(); // Response from backend
      const transformedTodos: TodoItem[] = Object.entries(data).map(([id, [description, complete]]) => ({
        id,
        description,
        complete,
      }));
      setTodos(transformedTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Fetch tasks from the backend on first load
  useEffect(() => {
    fetchTodos().then(() => {
      const baseUrl = process.env.API_HOST || 'http://localhost:8000';
      const socket = new WebSocket(`${baseUrl.replace('http', 'ws')}/ws/tasks_changed`);
  
      socket.onmessage = (event) => {
        const task = JSON.parse(event.data);
        console.log("Live task:", task);

        if(task.action === 'add') {
          console.log("Adding task:", task);
          setTodos((prev) => [
            ...prev,
            { id: task.id, description: task.description, complete: task.complete },
          ]);
        } else if(task.action === 'edit') {
          console.log("Updating task:", task);
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === task.id
                ? { ...todo, description: task.description, complete: task.complete }
                : todo
            )
          );
        } else if(task.action === 'delete') {
          console.log("Deleting task:", task);
          setTodos((prev) => prev.filter((todo) => todo.id !== task.id));
        }
      };
  
      return () => {
        socket.close();
      }
    });    
  }, []); // Empty dependency array ensures this runs only once on first load

  const addTodo = () => {
    // Generate a new todo item with a unique ID
    const newId = generateUUID();
    createTask(newId, `Todo Item ${todos.length + 1}`, false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#f9f7dd] space-y-4">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`flex items-center px-4 py-2 w-64 rounded-full ${
            todo.complete ? 'bg-[#e3d1ae]' : 'bg-[#b47b4e]'
          }`}
        >
          <input
            type="checkbox"
            checked={todo.complete}
            onChange={(e) => {
              const newComplete = e.target.checked;
              setTodos((prev) =>
                prev.map((t) =>
                  t.id === todo.id ? { ...t, complete: newComplete } : t
                )
              );
              if (todo.id && todo.description && typeof newComplete === 'boolean')
                updateTask(todo.id, todo.description, newComplete); // Update backend
            }}
            className="mr-3 w-4 h-4"
          />
            <input
            type="text"
            value={todo.description}
            onChange={(e) => {
              const newDescription = e.target.value;
              setTodos((prev) =>
                prev.map((t) =>
                  t.id === todo.id ? { ...t, description: newDescription } : t
                )
              );
            }}
            onBlur={() => {
              if (todo.id && todo.description && typeof todo.complete === 'boolean')
                updateTask(todo.id, todo.description, todo.complete)
            }}
            className={`bg-transparent text-white ${
              todo.complete ? 'line-through text-opacity-70' : ''
            } focus:outline-none`}
            />
        </div>
      ))}

      <button
        onClick={addTodo}
        className="mt-6 px-8 py-2 bg-[#b47b4e] text-white text-2xl rounded-full hover:bg-[#99603d] transition"
      >
        +
      </button>
    </main>
  );
}
