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
	inquirer.prompt([
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
			message: "Annual Salary: ",
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
			doAgain();

		} else if(answers.action === 'addRole') {
			console.log(chalk.blue('Adding New Role'));
			doAgain();

		} else if(answers.action === 'addEmployee') {
			console.log(chalk.yellow('Adding New Employee'));
			doAgain();

		} else {
			console.log(chalk.red("Goodbye!"));
		}
	});
}

function doAgain() {
	inquirer.prompt([
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

/**
 * query and async function setup from here:
 * https://stackoverflow.com/questions/60603462/getting-result-from-mysql?noredirect=1&lq=1
 */
function query(sql, args = []) {
	return new Promise(function(resolve, reject) {
		connection.query(sql, args, (err, result) => {
			if(err) return reject(err);
			resolve(result);
		});
	});
}

async function getDepartments() {
	const result = await query('SELECT * FROM departments');

	if(Array.isArray(result) && result.length > 0) return result[0];
	return null;
}

async function getRoles() {
	const result = await query('SELECT * FROM roles');

	if(Array.isArray(result) && result.length > 0) return result[0];
	return null;
}

async function getEmployees() {
	const result = await query('SELECT * FROM employees');

	if(Array.isArray(result) && result.length > 0) return result[0];
	return null;
}

start();