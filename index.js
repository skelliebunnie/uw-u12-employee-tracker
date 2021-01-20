const mysql = require('mysql');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ctable = require('console.table');

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
			let employee = {
				first_name: answers.employeeFirstName,
				last_name: answers.employeeLastName,
				role_id: null,
				manager: null
			}
			let roleList = getRoles();
			let employeeList = getEmployees();

			roleList.then((res) => {
				let roles = res.length > 0 ? makeChoices(res, "title", "id") : [];
				let employees = employeeList.length > 0 ? makeChoices(employeeList, ["first_name", "last_name"], "id") : [];

				roles.unshift({name: "None", value: "none"});
				employees.unshift({name: "None", value: "none"});

				inquirer.registerPrompt('search-list', require('inquirer-search-list'));
				inquirer.prompt([
					{
						type: "search-list",
						message: "Select a Role:",
						name: "employeeRole",
						choices: roles
					},
					{
						type: "search-list",
						message: "Select Manager:",
						name: "employeeManager",
						choices: employees
					},
				]).then((newInfo) => {
					employee.role_id = newInfo.employeeRole !== "none" ? newInfo.employeeRole : null;
					employee.manager = newInfo.employeeManager !== "none" ? newInfo.employeeManager : null;

					console.log(employee);

					doAgain();
				});
			});

		} else {
			console.log(chalk.red("Goodbye!"));
			connection.end();
			return;
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
			console.log(chalk.bold.bgCyan('Goodbye!'));
			connection.end();
			return;
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

async function getDepartments(where={}) {
	let result;
	let sql = 'SELECT * FROM departments';
	let args = [];

	if(!isEmpty(where)) {
		args = Object.values(where);

		sql += ' WHERE ';
		for(var prop in where) {
			sql += `${prop}=? `;
		}

		result = await query(sql.trim(), args);

	} else {
		result = await query(sql);

	}

	if(Array.isArray(result) && result.length > 0) return result;
	return [];
}

async function getRoles(where={}) {
	let result;
	let sql = 'SELECT * FROM roles';
	let args = [];

	if(!isEmpty(where)) {
		args = Object.values(where);

		sql += ' WHERE ';
		for(var prop in where) {
			sql += `${prop}=? `;
		}

		result = await query(sql.trim(), args);

	} else {
		result = await query(sql);

	}

	if(Array.isArray(result) && result.length > 0) return result;
	return [];
}

async function getEmployees(where={}) {
	let result;
	let sql = 'SELECT * FROM employees';
	let args = [];

	if(!isEmpty(where)) {
		args = Object.values(where);

		sql += ' WHERE ';
		for(var prop in where) {
			sql += `${prop}=? `;
		}

		result = await query(sql.trim(), args);

	} else {
		result = await query(sql);

	}

	if(Array.isArray(result) && result.length > 0) return result;
	return [];
}

function makeChoices(arr, nameKey, valKey) {
	let choices = [];

	for(var i = 0; i < arr.length; i++) {
		let name = "";
		if(Array.isArray(nameKey)) name = arr[i][nameKey];
		if(!Array.isArray(nameKey)) {
			for(var i in nameKey) {
				let key = nameKey[i];
				name += `${arr[key]} `;
			}
		}

		let obj = {
			name: name.trim(),
			value: arr[i][valKey]
		}
		choices.push(obj);
	}

	return choices;
}

// https://stackoverflow.com/a/679937
function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop))
      return false;
  }

  return true;
} 

start();