const mysql = require('mysql');
const inquirer = require('inquirer');
const chalk = require('chalk');

connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: '',
	database: 'employee_tracker_db'
});

function start() {
	inquirerprompt([
		{
			type: 'list',
			name: 'action',
			message: 'What would you like to do?',
			choices: [
				{
					name: "Add Department",
					value: 'addDepartment'
				},
				{
					name: "Add Role",
					value: 'addRole'
				},
				{
					name: "Add Employee",
					value: "addEmployee"
				},
				{
					name: "Exit",
					value: "exit"
				}
			]
		},
		{
			type: "input",
			name: "departmentName",
			message: "Department Name: ",
			when: function(answers) {
				return answers.action === 'addDepartment' ? true : false;
			}
		},
		{
			type: "input",
			name: "roleTitle",
			message: "Role Title: ",
			when: function(answers) {
				return answers.action === 'addRole' ? true : false;
			}
		},
		{
			type: "input",
			name: "roleSalary",
			message: "Role Salary: ",
			when: function(answers) {
				return answers.action === 'addRole' ? true : false;
			}
		},
		{
			type: "input",
			name: "employeeFirstName",
			message: "First Name: ",
			when: function(answers) {
				return answers.action === 'addEmployee' ? true : false;
			}
		},
		{
			type: "input",
			name: "employeeLastName",
			message: "Last Name: ",
			when: function(answers) {
				return answers.action === 'addEmployee' ? true : false;
			}
		}
	]).
	then(answers => {
		if(answers.action === 'addDepartment') {
			console.log(chalk.green('Adding New Department'));

		} else if(answers.action === 'addRole') {
			console.log(chalk.red('Adding New Role'));

		} else if(answers.action === 'addEmployee') {
			console.log(chalk.yellow('Adding New Department'));

		} else {
			console.log(chalk.red("Goodbye!"));
		}
	});
}

function doAgain() {
	inquirerprompt([
		{
			type: "confirm",
			name: "doAgain",
			message: "Would you like to continue?"
		}
	]).then(answers => {
		if(answers.doAgain) {
			start();
		} else {
			console.log('Goodbye!');
			connection.end();
		}

	});
}

start();