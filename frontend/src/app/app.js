// make API calls to main.py here
import axios from 'axios';
const baseUrl = process.env.API_HOST || 'http://localhost:8000';

const apiClient = axios.create({  
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});
async function createTask(uuid, description, complete) {
  try {
    return (await apiClient.post('/tasks', {}, {
      params: {
        uuid: uuid,
        description: description,
        complete: complete
      }
    })).data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

async function getTasks() {
  try {
    return (await apiClient.get('/tasks')).data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

async function updateTask(uuid, description, complete) {
  try {
    return (await apiClient.put(`/tasks/${uuid}`, {
      uuid: uuid,
      description: description,
      complete: complete
    })).data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

async function deleteTask(uuid) {
  try {
    return (await apiClient.delete(`/tasks/${uuid}`)).data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export { createTask, getTasks, updateTask, deleteTask };
export default apiClient;