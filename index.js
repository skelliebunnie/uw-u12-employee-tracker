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
		name: ">> BACK <<",
		value: 'back'
	}
];

function start() {
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
					name: "View Utilized Budget",
					value: "budget"
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
		if(answers.action === "add" && answers.target !== "back") {
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
					console.log(`I don't know how to target ${answers.target} - restarting`);
					start();
					break;
			}
		}

		if(answers.action === "list" && answers.target !== "back") {
			if(answers.target === "employees") {
				listEmployees();
			} else {
				list(answers.target);
			}
		}

		if(answers.action === "modify" && answers.target !== "back") {
			modify(answers.target);
		}

		if(answers.action === "remove" && answers.target !== "back") {
			remove(answers.target);
		}

		if(answers.action === "budget") {
			viewUtilizedBudget();
		}

		if(answers.target === "back") {
			start();
		}

		if(answers.action === "exit") {
			console.log(chalk.bgCyan(' Goodbye! '));
			connection.end();
			return;
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
		if(answers.name !== "") {
			insert('departments', {name: answers.name});

			let departments = get('departments');
			for(var i in departments) {
				if(departments[i].name === answers.name) {
					console.log(chalk.bgGreen(` Successfully added ${departments[i].name} as a new Department `));
				}
			}
		} else {
			console.log(chalk.bgOrange(' Cannot add a Department with a blank name '));
		}

		start();
	});
}

function addRole() {
	let departmentList = get("departments");

	departmentList.then(data => {
		let departments = data.length > 0 ? makeChoices(data, "name", "id") : [];

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
	let all = getAll();

	all.then(data => {
		let roles = data[1].length > 0 ? makeChoices(data[1], "title", "id") : [];
		let employees = data[2].length > 0 ? makeChoices(data[2], "full_name", "id") : [];

		employees.unshift({name: "None", value: "none", short: "None"});

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
			employee.manager_id = employee.manager_id !== "none" ? employee.manager_id : null;

			if(employee.role_id !== "none") {
				let insertEmployee = insert('employees', employee);

				insertEmployee.then(employees => {
					for(var i in employees) {
						if(employees[i].first_name === employee.first_name && employees[i].last_name === employee.last_name) {
							console.log(chalk.bgGreen(` Successfully added ${employees[i].first_name} ${employees[i].last_name} as a new employee `));
						}
					}

					start();
				});
			} else {
				console.log(chalk.bgRed(' You MUST select a role for the employee! Please try again. '));
				addEmployee();
			}
		});
	})
}

function modify(table) {

	let all = getAll();

	all.then(data => {
		let departments = data[0].length > 0 ? makeChoices(data[0], "name", "id") : [{name: "None", value: "none", short: "None"}];
		let roles = data[1].length > 0 ? makeChoices(data[1], "title", "id") : [{name: "None", value: "none", short: "None"}];
		let employees = data[2].length > 0 ? makeChoices(data[2], "full_name", "id") : [{name: "None", value: "none", short: "None"}];

		departments.push({name: " >> BACK << ", value: "back"});
		roles.push({name: " >> BACK << ", value: "back"});
		employees.push({name: " >> BACK << ", value: "back"});

		inquirer.prompt([
			{
				type: "search-list",
				name: "targetID",
				message: "Which Department would you like to update?",
				choices: departments,
				when: function(answers) {
					return table === "departments" ? true : false;
				}
			},
			// targetKey = "name" for department
			{
				type: "input",
				message: "New Name:",
				name: "newValue",
				when: function(answers) {
					return table === "departments" ? true : false;
				}
			},
			{
				type: "search-list",
				name: "targetID",
				message: "Which Role would you like to update?",
				choices: roles,
				when: function(answers) {
					return table === "roles" ? true : false;
				}
			},
			{
				type: "list",
				name: "targetKey",
				message: "What do you want to update?",
				choices: [
				{name: "Title", value: "title"}, {name: "Salary", value: "salary"}, {name: "Department", value: "department_id"}],
				when: function(answers) {
					return table === "roles" ? true : false;
				}
			},
			{
				type: "input",
				message: "New Title:",
				name: "newValue",
				when: function(answers) {
					if(table === "roles" && answers.targetKey === "title") {
						return true;
					}
					return false;
				}
			},
			{
				type: "number",
				message: "New Annual Salary:",
				name: "newValue",
				when: function(answers) {
					if(table === "roles" && answers.targetKey === "salary") {
						return true;
					}
					return false;
				}
			},
			{
				type: "list",
				message: "New Department:",
				name: "newValue",
				choices: departments,
				when: function(answers) {
					if(table === "roles" && answers.targetKey === "department_id") {
						return true;
					}
					return false;
				}
			},
			{
				type: "search-list",
				name: "targetID",
				message: "Which Employee would you like to update?",
				choices: employees,
				when: function(answers) {
					return table === "employees" ? true : false;
				}
			},
			{
				type: "list",
				name: "targetKey",
				message: "What do you want to update?",
				choices: [{name: "First Name", value: "first_name"}, {name: "Last Name", value: "last_name"}, {name: "Role", value: "role_id"}, {name: "Manager", value: "manager_id"}],
				when: function(answers) {
					return table === "employees" ? true : false;
				}
			},
			{
				type: "input",
				message: "New First Name:",
				name: "newValue",
				when: function(answers) {
					if(table === "employees" && answers.targetKey === "first_name") {
						return true;
					}
					return false;
				}
			},
			{
				type: "input",
				message: "New Last Name:",
				name: "newValue",
				when: function(answers) {
					if(table === "employees" && answers.targetKey === "last_name") {
						return true;
					}
					return false;
				}
			},
			{
				type: "list",
				message: "New Role:",
				name: "newValue",
				choices: roles,
				when: function(answers) {
					if(table === "employees" && answers.targetKey === "role_id") {
						return true;
					}
					return false;
				}
			},
			{
				type: "list",
				message: "New Manager:",
				name: "newValue",
				choices: employees,
				when: function(answers) {
					if(table === "employees" && answers.targetKey === "manager_id") {
						return true;
					}
					return false;
				}
			}
		]).then(answers => {
			if(answers.targetID !== "back") {
				if(table === "departments") answers.targetKey = "name";
				let set = [answers.targetKey, "=", answers.newValue];
				let where = ["id", "=", answers.targetID];

				update(table, set, where);

				let check = get(table);
				check.then(res => {
					if(res.length > 0) {
						console.log(chalk.bgGreen(` Successfully updated the key ${answers.targetKey} in the ${table} table @ ID ${answers.targetID} to ${answers.newValue} `));
					}
					start();
				});
			} else {
				start();
			}
		});
	})
}

function list(table) {
	let data = get(table);

	data.then(results => {
		if(results.length > 0) {
			console.table(results);

		} else {
			console.log(chalk.bgRed(` No ${table} found. `));
		}

		start();
	});
}

function listEmployees() {
	let data = get("employees");

	data.then(employees => {
		let choices = employees.length > 0 ? makeChoices(employees, "full_name", "id") : [];
		if(choices.length > 0) {
			inquirer.prompt([
				{
					type: "confirm",
					name: "confirm",
					message: "Would you like to view employees for a specific Manager?"
				},
				{
					type: "search-list",
					name: "manager_id",
					message: "Select Manager:",
					choices: choices,
					when: function(answers) {
						if(answers.confirm && choices.length > 0) return true;

						return false;
					}
				}
			]).then(answers => {
				// console.log(answers);
				if(answers.confirm == true) {
					listEmployeesByManager(answers.manager_id);

				} else {
					console.table(employees);
					start();

				}

			});

		} else {
			console.table(employees);
			start();
		}
	});
}

function listEmployeesByManager(manager_id) {
	let list = query('SELECT * FROM employees WHERE manager_id=?', [manager_id]);

	list.then(results => {
		if(results.length > 0) {
			console.table(results);

		} else {
			console.log(chalk.bgRed(` No direct reports found. `));
		}
		start();
	});
}

function viewUtilizedBudget() {
	let data = get("departments");

	data.then(departments => {
		let choices = departments.length > 0 ? makeChoices(departments, "name", "id") : [];

		if(choices.length > 0) {
			inquirer.prompt([
				{
					type: "search-list",
					name: "department_id",
					message: "Select Department:",
					choices: choices
				}
			]).then(answers => {
				let department_id = answers.department_id;

				// utilized budget = combined salaries of all employees in a department
				// department -> role (has salary) -> employees
				// get all employees with a role that as department_id = department id
				let sql = 'SELECT SUM(salary) AS utilized_budget FROM roles JOIN employees ON employees.role_id=roles.id WHERE department_id=?';
				let list = query(sql, [department_id]);
				list.then(results => {
					if(results.length > 0 && results.utilized_budget != null) {
						console.table(results);

					} else {
						console.log(chalk.bgRed(` No data found. `));
					}
					start();
				});
			});
		}

	});
}

function remove(table) {
	let data = getAll();

	data.then(res => {
		let choices = [], key;
		if(table === "departments") {
			choices = res[0];
			key = "name";
		} else if(table === "roles") {
			choices = res[1];
			key = "title";
		} else {
			choices = res[2];
			key = "full_name";
		}
		choices = choices.length > 0 ? makeChoices(choices, key, "id") : [{name: "None", value: "none", short: "None"}];
		
		if(choices.length > 0) {
			inquirer.prompt([
				{
					type: "search-list",
					name: "targetID",
					message: `Which of the ${table} do you want to delete?`,
					choices: choices
				}
			]).then(answers => {
				let targetID = answers.targetID;
				let target = choices.filter(choice => choice.value == answers.targetID);
				
				if(table === "departments" || table === "roles") {
					let newChoices = choices.filter(choice => choice.id != answers.targetID);
					let tableName = table.slice(0, -1);

					inquirer.prompt([
						{
							type: "search-list",
							name: "newID",
							message: `You must select a replacement ${tableName}:`,
							choices: newChoices
						}
					]).then(answers => {
						let newID = answers.newID;

						let set = [], where = [];
						if(table === "roles") {
							set = ["role_id", "=", newID];
							where = ["role_id", "=", targetID];
							update("employees", set, where);

						} else if(table === "departments") {
							set = ["department_id", "=", newID];
							where = ["department_id", "=", targetID];
							update("roles", set, where);

						}

						destroy(table, {id: answers.targetID});
						console.log(chalk.bold.bgRed(` DELETED ${target[0].name} from ${table} `));

						start();
					});

				} else {
					start();

				}
			});

		} else {
			console.log(chalk.bold.bgRed(` No ${table} found. `));
			start();
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
	let result = await query(`SELECT * FROM ${table} WHERE id=?`, [id]);

	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

async function getAll() {
	let departments = await query('SELECT * FROM departments');
	let roles = await query('SELECT * FROM roles');
	let employees = await query('SELECT * FROM employees');

	return [departments, roles, employees];
}

async function insert(table, data) {
	let result;

	let keys = Object.keys(data).join(",");
	let args = Object.values(data);

	let valueMarks = [];
	for(var i in args) {
		valueMarks.push("?");
	}

	let sql = `INSERT INTO ${table} (${keys}) VALUES (${valueMarks.join(',')})`;

	result = await query(sql, args);

	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

async function update(table, set, where) {
	let result;

	result = await query(`UPDATE ${table} SET ${set[0]}${set[1]}? WHERE ${where[0]}${where[1]}?`, [set[2], where[2]]);

	// connection.end();
	if(Array.isArray(result)) return result;
	return [];
}

async function destroy(table, where={}) {
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
		let name = arr[i][nameKey];

		if(nameKey === "full_name") {
			name = `${arr[i].first_name} ${arr[i].last_name}`;
		}

		if(name === "undefined undefined" || name === "undefined") {
			name = arr[i].id;
		}

		let obj = {
			name: name,
			value: arr[i][valKey],
			short: name
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