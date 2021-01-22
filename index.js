const mysql = require('mysql');
const inquirer = require('inquirer');
const chalk = require('chalk');
// const ctable = require('console.table');

inquirer.registerPrompt('search-list', require('inquirer-search-list'));

connection = mysql.createConnection({
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: '',
	database: 'employee_tracker_db'
});

let departments = [];
let roles 			= [];
let employees 	= [];

function start() {

	let type = [
		{
			name: "Department",
			value: 'departments'
		},
		{
			name: "Role",
			value: 'roles'
		},
		{
			name: "Employee",
			value: 'employees'
		},
		{
			name: "Exit",
			value: 'exit'
		}
	];

	inquirer.prompt([
		{
			type: 'list',
			name: 'action',
			message: 'What would you like to do?',
			choices: [
				{
					name: "Add",
					value: 'add'
				},
				{
					name: "List",
					value: 'list'
				},
				{
					name: "Update",
					value: 'modify'
				},
				{
					name: "Delete",
					value: 'remove'
				},
				{
					name: "Exit",
					value: 'exit'
				}
			]
		},
		{
			type: 'list',
			name: 'target',
			message: 'What would you like to Add?',
			choices: type,
			when: function(answers) {
				return answers.action === "add" ? true : false;
			}
		},
		{
			type: 'list',
			name: 'target',
			message: 'What would you like to List?',
			choices: type,
			when: function(answers) {
				return answers.action === "list" ? true : false;
			}
		},
		{
			type: 'list',
			name: 'target',
			message: 'What would you like to Update?',
			choices: type,
			when: function(answers) {
				return answers.action === "modify" ? true : false;
			}
		},
		{
			type: 'list',
			name: 'target',
			message: 'What would you like to Delete?',
			choices: type,
			when: function(answers) {
				return answers.action === "remove" ? true : false;
			}
		}
	]).then(answers => {
		if(answers.action === "add") {
			departments = get("departments");
			roles 			= get("roles");
			employees 	= get("employees");

			employees.then(res => {
				switch(answers.target) {
					case "departments":
						addDepartment();
						break;
					case "roles":
						addRole();
						break;
					case "employees":
						addEmployee();
						break;
					default:
						console.log("I don't know what to do!");
						break;
				}
			});
		}

		if(answers.action === "list") {
			list(answers.target);
		}

		if(answers.action === "modify") {
			modify(answers.target);
		}

		if(answers.action === "exit") {
			console.log(chalk.bgRed(' Goodbye! '));
			if(connection.status !== "disconnected") connection.end();
		}
	});
}

function addDepartment() {
	inquirer.prompt([
		{
			type: "input",
			message: "Department Name:",
			name: "name"
		}
	]).then(answers => {
		insert('departments', {name: answers.name});

		let departments = get('departments');
		for(var i in departments) {
			if(departments[i].name === answers.name) {
				console.log(chalk.bgGreen(` Successfully added ${departments[i].name} as a new Department `));
			}
		}

		start();
	});
}

function addRole() {
	let departmentList = get("departments");

	departmentList.then(data => {
		let departments = data.length > 0 ? makeChoices(data, "name", "id") : [];
		// departments.unshift({name: "None", value: "none"});

		inquirer.prompt([
			{
				type: "input",
				name: "title",
				message: "Role Title:"
			},
			{
				type: "number",
				name: "salary",
				message: "Annual Salary:"
			},
			{
				type: "list",
				name: "department_id",
				message: "Department this role belongs to: ",
				choices: departments
			}
		]).then(role => {
			role.department_id = role.department_id !== "none" ? role.department_id : null;
			insert('roles', role);

			let roles = get('roles');
			for(var i in roles) {
				if(roles[i].title === role.roleTitle) {
					console.log(chalk.bgGreen(` Successfully added ${roles[i].title} as a new Role `));
				}
			}

			start();
		});
	})
}

function addEmployee() {
	let roleList = get('roles');
	let employeeList = get('employees');

	roleList.then(data => {
		let roles = data.length > 0 ? makeChoices(data, "title", "id") : [];
		let employees = employeeList.length > 0 ? makeChoices(employeeList, ["first_name", "last_name"], "id") : [];

		roles.unshift({name: "None", value: "none"});
		employees.unshift({name: "None", value: "none"});

		inquirer.prompt([
			{
				type: "input",
				message: "First Name:",
				name: "first_name"
			},
			{
				type: "input",
				message: "Last Name:",
				name: "last_name"
			},
			{
				type: "search-list",
				message: "Select a Role:",
				name: "role_id",
				choices: roles
			},
			{
				type: "search-list",
				message: "Select Manager:",
				name: "manager_id",
				choices: employees
			}
		]).then((employee) => {
			employee.role_id = employee.role_id !== "none" ? employee.role : null,
			employee.manager = employee.manager_id !== "none" ? employee.manager : null,

			insert('employees', employee);

			let employees = get('employees');
			for(var i in employees) {
				if(employees[i].first_name === answers.first_name && employees[i].last_name === answers.last_name) {
					console.log(chalk.bgGreen(` Successfully added ${employees[i].first_name} ${employees[i].last_name} as a new employee `));
				}
			}

			start();
		});
	})
}

function modify(table) {

	let rolesList = get("roles");
	let employeesList = get('employees');
	let departmentsList = get("departments");


	departmentsList.then(data => {
		let departments = data.length > 0 ? makeChoices(data, "name", "id") : [{name: "None", value: "none"}];
		let roles = rolesList.length > 0 ? makeChoices(rolesList, "name", "id") : [{name: "None", value: "none"}];
		let employees = employeesList.length > 0 ? makeChoices(employeesList, "name", "id") : [{name: "None", value: "none"}];

		inquirer.prompt([
			{
				type: "search-list",
				name: "target",
				message: "Which Department would you like to update?",
				choices: departments,
				when: function(answers) {
					return table === "departments" ? true : false;
				}
			},
			{
				type: "input",
				message: "New Name:",
				name: "departmentName",
				when: function(answers) {
					return table === "departments" ? true : false;
				}
			},
			{
				type: "search-list",
				name: "target",
				message: "Which Role would you like to update?",
				choices: roles,
				when: function(answers) {
					return table === "roles" ? true : false;
				}
			},
			{
				type: "list",
				name: "target",
				message: "What do you want to update?",
				choices: [{name: "Title", value: "title"}, {name: "Salary", value: "salary"}, {name: "Department", value: "roleDepartment"}],
				when: function(answers) {
					return table === "roles" ? true : false;
				}
			},
			{
				type: "input",
				message: "New Title:",
				name: "roleTitle",
				when: function(answers) {
					if(table === "roles" && answers.target === "title") {
						return true;
					}
					return false;
				}
			},
			{
				type: "number",
				message: "New Annual Salary:",
				name: "roleSalary",
				when: function(answers) {
					if(table === "roles" && answers.target === "salary") {
						return true;
					}
					return false;
				}
			},
			{
				type: "list",
				message: "New Department:",
				name: "roleDepartment",
				choices: departments,
				when: function(answers) {
					if(table === "roles" && answers.target === "roleDepartment") {
						return true;
					}
					return false;
				}
			},
			{
				type: "search-list",
				name: "target",
				message: "Which Employee would you like to update?",
				choices: employees,
				when: function(answers) {
					return table === "employees" ? true : false;
				}
			},
			{
				type: "list",
				name: "target",
				message: "What do you want to update?",
				choices: [{name: "First Name", value: "first"}, {name: "Last Name", value: "last"}, {name: "Role", value: "role"}, {name: "Manager", value: "manager"}],
				when: function(answers) {
					return table === "roles" ? true : false;
				}
			},
			{
				type: "input",
				message: "New First Name:",
				name: "newFirstName",
				when: function(answers) {
					if(table === "employees" && answers.target === "first") {
						return true;
					}
					return false;
				}
			},
			{
				type: "input",
				message: "New Last Name:",
				name: "newLastName",
				when: function(answers) {
					if(table === "employees" && answers.target === "last") {
						return true;
					}
					return false;
				}
			},
			{
				type: "list",
				message: "New Role:",
				name: "employeeRole",
				choices: roles,
				when: function(answers) {
					if(table === "employee" && answers.target === "role") {
						return true;
					}
					return false;
				}
			},
			{
				type: "list",
				message: "New Manager:",
				name: "employeeManager",
				choices: employees,
				when: function(answers) {
					if(table === "employee" && answers.target === "manager") {
						return true;
					}
					return false;
				}
			}
		]).then(answers => {
			console.log(answers);
		});
	})
}

function list(table) {
	let results = get(table);

	results.then(data => {
		if(data.length > 0) {
			console.table(data);
		} else {
			console.log(chalk.bgRed(`No ${table} found.`));
		}
		start();
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
			// connection.end();
		});
	});
}

// where = {}
async function get(table) {
	let result;
	let sql = `SELECT * FROM ${table}`;
	let args = [];

	result = await query(sql);

	// if(!isEmpty(where)) {
	// 	args = Object.values(where);

	// 	sql += ' WHERE ';
	// 	for(var prop in where) {
	// 		sql += `${prop}=? `;
	// 	}

	// 	result = await query(sql.trim(), args);

	// } else {
	// 	result = await query(sql);

	// }
	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

async function getSingle(table, id) {
	result = await query(`SELECT * FROM ${table} WHERE id=?`, [id]);

	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

async function insert(table, data) {
	let result;

	let keys = Object.keys(data).join(",");
	let values = Object.values(data);

	let valueMarks = [];
	for(var i in values) {
		valueMarks.push("?");
	}

	let sql = `INSERT INTO ${table} (${keys}) VALUES (${valueMarks.join(',')})`;

	result = await query(sql, values);

	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

async function update(table, set, where) {
	let result;

	result = await query(`UPDATE ${table} SET ${set[0]}${set[1]}${set[2]} WHERE ${where[0]}${where[1]}${$where[2]}`);

	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

async function remove(table, where={}) {
	let result;
	let sql = `DELETE FROM ${table}`;
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

	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

function makeChoices(arr, nameKey, valKey) {
	let choices = [];

	for(var i = 0; i < arr.length; i++) {
		let name = "";
		if(!Array.isArray(nameKey)) name = arr[i][nameKey];
		if(Array.isArray(nameKey)) {
			for(var i in nameKey) {
				let key = nameKey[i];
				name += `${arr[key]} `;
			}
		}

		let obj = {
			name: name.trim(),
			value: arr[i][valKey],
			short: name.trim()
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