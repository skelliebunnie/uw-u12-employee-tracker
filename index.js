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

async function updateEmployee() {
	let employeeList = getEmployees();
	let rolesList = getRoles();
	let departments = getDepartments();
	
	employeeList.then(function(res) {
		let employees = [], roles = [];

		for(var i = 0; i < res.length; i++) {
			let employeeObj = {
				name: `${res[i].first_name res[i].last_name}, ${rolesList[res[i].role].title}, ${departments[rolesList[res[i].role].id].name}`,
				value: res[i].id
			}
			employees.push(employeeObj);

			let roleObj = {
				name: rolesList[i].title,
				value: rolesList[i].id
			}
			roles.push(roleObj);
		}

		inquirerprompt([
			{
				type: "list",
				name: "employeeID",
				message: "Which Employee would you like to update?",
				choices: employees
			},
			{
				type: "list",
				name: "updateTarget",
				message: "What would you like to update?",
				choices: [
					{
						name: "First Name",
						value: "updateFirstName"
					},
					{
						name: "Last Name",
						value: "updateLastName"
					},
					{
						name: "Role",
						value: "updateRole"
					},
					{
						name: "Manager",
						value: "updateManager"
					}
				]
			},
			{
				type: "list",
				name: "roleID",
				message: "What's their new role?",
				choices: roles,
				when: function(answers) {
					return answers.updateTarget === "updateRole" ? true : false;
				}
			}
		]).then(answers => {
			console.log(answers);
			// let result = updateEmployee(answers.employeeID, answers.roleID);

			// result.then((res) => {
			// 	console.log(res);
			// 	doAgain();
			// });
		});
	});

}

async function getEmployees() {
	const result = await query('SELECT * FROM employees');

	if(Array.isArray(result) && result.length > 0) return result;
	return null;
}

async function getRoles() {
	const result = await query('SELECT * FROM roles');

	if(Array.isArray(result) && result.length > 0) return result[0];
	return null;
}

async function getDepartments() {
	const result = await query('SELECT * FROM departments');

	if(Array.isArray(result) && result.length > 0) return result[0];
	return null;
}

async function getSingle(table,id) {
	const result = await query(`SELECT * FROM ${table} WHERE id=?`, [id]);
}

async function addEmployee(first, last, role, manager) {
	const result = await query('INSERT INTO items (first_name, last_name, role_id, manager_id) VALUES(?, ?, ?, ?)', [first, last, role, manager]);

	if(Array.isArray(result) && result.length > 0) return result;
	return null;

}

async function updateEmployee(emp_id, role_id) {
	const update = await query('UPDATE employees SET role=? WHERE id=?', [role_id, emp_id]);

	const result = await query('SELECT * FROM employees WHERE id=?', [emp_id]);

	if(Array.isArray(result) && result.length > 0) return result[0];
	return null;
}

start();