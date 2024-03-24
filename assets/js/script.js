// Retrieve tasks and nextId from localStorage
let taskList = JSON.parse(localStorage.getItem("tasks"));
let nextId = JSON.parse(localStorage.getItem("nextId"));

// Todo: create a function to generate a unique task id
function generateTaskId() {
  //make nextId = 0 if it doesn't exist
  let currentId = parseInt(localStorage.getItem("nextId"), 10) || 0;
  //add 1 to nextId
  localStorage.setItem("nextId", JSON.stringify(currentId + 1));
  return currentId;
}

function readTasksFromStorage() {
  const tasks = JSON.parse(localStorage.getItem("tasks"));
  if (!tasks) {
    tasks = [];
  }
  return tasks;
}

function saveTasksToStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Todo: create a function to create a task card
function createTaskCard(task) {
  const taskCard = $("<div>")
    .addClass("card draggable my-3") //removed project-card class
    .attr("task-id", task.id);
  const cardHeader = $("<div>").addClass("card-header h4").text(task.name);
  const cardBody = $("<div>").addClass("card-body");
  const taskDueDate = $("<p>").addClass("card-text").text(task.dueDate);
  const taskDescription = $("<p>").addClass("card-text").text(task.description);
  const cardDeleteBtn = $("<button>")
    .addClass("btn btn-danger delete")
    .text("Delete")
    .attr("task-id", task.id);
  cardDeleteBtn.on("click", handleDeleteTask);

  //set card background color based on due date.
  if (task.dueDate && task.status !== "done") {
    const now = dayjs();
    const taskDueDate = dayjs(task.dueDate, "DD/MM/YYYY");

    //if due today, task is yellow, before today is red
    if (now.isSame(taskDueDate, "day")) {
      taskCard.addClass("bg-warning text-white");
    } else if (now.isAfter(taskDueDate)) {
      taskCard.addClass("bg-danger text-white");
      cardDeleteBtn.addClass("border-light");
    }
  }

  //append elements created above
  cardBody.append(taskDueDate, taskDescription, cardDeleteBtn);
  taskCard.append(cardHeader, cardBody);

  // Make the newly created card draggable
  taskCard.draggable({
    opacity: 0.7,
    zIndex: 100,
    helper: function (e) {
      const original = $(e.target).hasClass("ui-draggable")
        ? $(e.target)
        : $(e.target).closest(".ui-draggable");
      return original.clone().css({
        width: original.outerWidth(),
      });
    },
  });

  //return the card so it can be appended to the correct lane.
  return taskCard;
}

// Todo: create a function to render the task list and make cards draggable
function renderTaskList() {
  const tasks = readTasksFromStorage();

  //empty existing task cards out of the lanes
  const todoList = $("#todo-cards");
  todoList.empty();

  const inProgressList = $("#in-progress-cards");
  inProgressList.empty();

  const doneList = $("#done-cards");
  doneList.empty();

  //Loop through tasks and create task cards for each status
  for (let task of tasks) {
    if (task.status === "to-do") {
      todoList.append(createTaskCard(task));
    } else if (task.status === "in-progress") {
      inProgressList.append(createTaskCard(task));
    } else if (task.status === "done") {
      doneList.append(createTaskCard(task));
    }
  }

  // ? Use JQuery UI to make task cards draggable
  $(".draggable").draggable({
    opacity: 0.7,
    zIndex: 100,
    // ? This is the function that creates the clone of the card that is dragged. This is purely visual and does not affect the data.
    helper: function (e) {
      // ? Check if the target of the drag event is the card itself or a child element. If it is the card itself, clone it, otherwise find the parent card  that is draggable and clone that.
      const original = $(e.target).hasClass("ui-draggable")
        ? $(e.target)
        : $(e.target).closest(".ui-draggable");
      // ? Return the clone with the width set to the width of the original card. This is so the clone does not take up the entire width of the lane. This is to also fix a visual bug where the card shrinks as it's dragged to the right.
      return original.clone().css({
        width: original.outerWidth(),
      });
    },
  });
}

// Todo: create a function to handle adding a new task
function handleAddTask(event) {
  event.preventDefault();

  //read user input from the form
  const taskNameInput = $("#task-title").val().trim();
  const taskDueInput = $("#datepicker").val();
  const taskDescInput = $("#task-desc-input").val().trim();

  console.log(taskNameInput, taskDueInput, taskDescInput);

  let nextId = generateTaskId();

  //create newTask array and give it a random id
  const newTask = {
    id: nextId,
    name: taskNameInput,
    dueDate: taskDueInput,
    description: taskDescInput,
    status: "to-do",
  };

  //append the tasks array
  const tasks = readTasksFromStorage();
  tasks.push(newTask);

  //save updated task list to storage
  localStorage.setItem("tasks", JSON.stringify(tasks));
  //re-render the task list with the new task
  renderTaskList();

  //close the modal
  $("#formModal").modal("hide");
}

// Todo: create a function to handle deleting a task
function handleDeleteTask() {
  //get task id of button
  const taskID = $(this).attr("task-id");
  //get tasks list
  const tasks = readTasksFromStorage();

  //remove task from the array.
  tasks.forEach((task) => {
    if (task.id == taskID) {
      tasks.splice(tasks.indexOf(task), 1);
    }
  });

  //use the helper function to save the tasks array to local storage
  saveTasksToStorage(tasks);

  //print the tasks back to the screen
  renderTaskList();
}

// Todo: create a function to handle dropping a task into a new status lane
function handleDrop(event, ui) {
  //read task from local storage
  let tasks = readTasksFromStorage();
  const droppedItemId = ui.draggable.attr("task-id");

  //get the unique task id from the task
  const taskID = ui.draggable.attr("task-id");
  console.log(taskID);

  // Get the id of the lane that the card was dropped into
  const newStatus = $(event.target).attr("id");

  for (let task of tasks) {
    // Find the project card by the `id` and update the project status.
    if (task.id == taskID) {
      task.status = newStatus;
      console.log(`Task ${taskID} is ${newStatus}`);
    }
  }
  // Save the updated projects array to localStorage (overwritting the previous one) and render the new project data to the screen.
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTaskList();
}

// add event listener to the form element, listen for a submit event, and call the `handleAddTask` function.
$("#add-task").click(handleAddTask);

//when page loads, render the task list
$(document).ready(function () {
  // Print project data to the screen on page load if there is any
  renderTaskList();

  $("#datepicker").datepicker({
    changeMonth: true,
    changeYear: true,
  });

  // Make lanes droppable
  $(".lane").droppable({
    accept: ".draggable",
    drop: handleDrop,
  });
});
