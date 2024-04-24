// Create a task list
const taskList = [];

// Add a task to the list
taskList.push({
  title: 'Task 1',
  description: 'This is the first task.',
  dueDate: new Date(),
  priority: 'high'
});

// Remove a task from the list
taskList.splice(0, 1);

// Update a task in the list
taskList[0].title = 'Updated Task';

// Get all tasks from the list
taskList.forEach(task => {
  console.log(task);
});
