// Packages
const mysql = require("mysql");
const inquirer = require("inquirer");

// Connections

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Luis.crxz1",
  database: "employees",
  multipleStatements: true,
});

connection.connect((err) => {
  if (err) throw err;
  console.log(`connected as id ${connection.threadId}`);
  startPrompt();
});

// First prompt

const startPrompt = () => {
  inquirer
    .prompt({
      name: "action",
      type: "list",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "Add Employee",
        "Update Employee Role",
        "View All Roles",
        "Add Role",
        "View All Departments",
        "Add Department",
        "Exit",
      ],
    })
    // Switch cases
    .then((answer) => {
      switch (answer.action) {
        case "View All Employees": // Minimum Requirements
          allEmployees();
          break;

        case "Add Employee": // Minimum Requirements
          addEmployee();
          break;

        case "Update Employee Role": // Minimum Requirements
          updateEmployeeRole();
          break;

        case "View All Roles": // Minimum Requirements
          allRoles();
          break;

        case "Add Role": // Minimum Requirements
          addRole();
          break;

        case "View All Departments": // Minimum Requirements
          allDepartments();
          break;

        case "Add Department": // Minimum Requirements
          addDepartment();
          break;

        case "Exit":
          connection.end();
          break;

        default:
          console.log(`Invalid action: ${answer.action}`);
          break;
      }
    });
};


// View all employees
const allEmployees = () => {
  let query =
    'SELECT  employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, concat(m.first_name," ", m.last_name) as manager FROM employee LEFT OUTER JOIN employee m ON employee.manager_id = m.id INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id ORDER by employee.id';
  connection.query(query, (err, res) => {
    if (err) throw err;
    const transformed = res.reduce((acc, { id, ...x }) => {
      acc[id] = x;
      return acc;
    }, {});
    console.table(transformed);
    startPrompt();
  });
};

//Add employee
const addEmployee = () => {
  connection.query('SELECT concat(id," ",title) as rolid FROM role; SELECT concat(id,".- ",first_name," ", last_name) as manid FROM employee', (err, results) => {
    if (err) throw err;
    inquirer
      .prompt([
        {
          name: 'first_name',
          type: 'input',
          message: "What is the employee's first name?",
        },
        {
          name: 'last_name',
          type: 'input',
          message: "What is the employee's last name?",
        },
        {
          name: 'role_id',
          type: 'list',
          choices() {
            return results[0].map((item) => item.rolid);
          },
          message: "What is the employee's role?",
        },
        {
          name: 'manager_id',
          type: 'list',
          choices() {
            const choiceArray = [];
            results[1].forEach(({ manid }) => {
              if (manid == null) {
                choiceArray.push('None');
              } else {
                choiceArray.push(manid);
              }
            });
            return choiceArray;
          },

          message: "What is the employee's manager?",
        },
      ])
      .then((answer) => {
        const strman = answer.manager_id;
        var strmanid = null;
        if (strman !== 'None') {
          strmanid = parseInt(strman.slice(0, strman.indexOf(' ')));
          console.log(strmanid);
        }

        const strrol = answer.role_id;
        const strrolid = parseInt(strrol.slice(0, strrol.indexOf(' ')));
        let query = 'INSERT INTO employee SET ?';
        connection.query(
          query,
          {
            first_name: answer.first_name,
            last_name: answer.last_name,
            role_id: strrolid,
            manager_id: strmanid,
          },
          (err) => {
            if (err) {
              throw err,
              console.log("Make sure that the role id and manager id exist")
            };
            console.log('A new employee was created successfully!');
            startPrompt();
          }
        );
      });
  });
};

//Update employee role
const updateEmployeeRole = () => {
  connection.query('SELECT concat(id,".- ",first_name," ", last_name) as updemp FROM employee;SELECT concat(id," ",title) as rolid FROM role', (err, results) => {
    if (err) throw err;
    inquirer
      .prompt([
        {
          name: 'choice',
          type: 'list',
          choices() {
            return results[0].map((item) => item.updemp);
          },
          message: "Which employee's role do you want to  update?",
        },
        {
          name: 'role_id',
          type: 'list',
          choices() {
            return results[1].map((item) => item.rolid);
          },
          message: "What is the employee's role?",
        },

      ])
      .then((answer) => {
        const strrol = answer.role_id;
        const strrolid = parseInt(strrol.slice(0, strrol.indexOf(' ')));
        const strid = answer.choice;
        const strnameid = parseInt(strid.slice(0, strid.indexOf('.- ')));
        let query = 'UPDATE employee SET ? WHERE ?';
        connection.query(query, [
          {
            role_id: strrolid,
          },
          {
            id: strnameid,
          },
        ], (err, res) => {
          if (err) throw err;
          console.log("Employee's role was updated successfully!");
          startPrompt();
        });
      });
  });
};

//View all roles
const allRoles = () => {
  let query = 'SELECT id, title FROM role';
  connection.query(query, (err, res) => {
    if (err) throw err;
    const transformed = res.reduce((acc, { id, ...x }) => { acc[id] = x; return acc }, {})
    console.table(transformed)
    startPrompt();
  });
};

//Add role
const addRole = () => {
  connection.query('SELECT concat(id," ",name) as depid FROM department', (err, results) => {
    if (err) throw err;
    inquirer
      .prompt([
        {
          name: 'name',
          type: 'input',
          message: 'What is the name of the role?',
        },
        {
          name: 'salary',
          type: 'input',
          message: 'What is the salary of the role?',
        },
        {
          name: 'choice',
          type: 'list',
          choices() {
            return results.map((item) => item.depid);
          },
          message: 'Which department does the role belong to ?',
        },
      ])
      .then((answer) => {
        const strdep = answer.choice;
        const strdepid = parseInt(strdep.slice(0, strdep.indexOf(' ')));
        let query = 'INSERT INTO role SET ?';
        connection.query(
          query,
          {
            title: answer.name,
            salary: parseInt(answer.salary),
            department_id: strdepid
          },
          (err) => {
            if (err) throw err;
            console.log('Your role was added successfully!');
            startPrompt();
          }
        );
      })
  })
};

//View all departments
const allDepartments = () => {
  let query = 'SELECT id, name FROM department';
  connection.query(query, (err, res) => {
    if (err) throw err;
    const transformed = res.reduce((acc, { id, ...x }) => { acc[id] = x; return acc }, {})
    console.table(transformed)
    startPrompt();
  });
};

//Add department
const addDepartment = () => {
  inquirer
    .prompt([
      {
        name: 'name',
        type: 'input',
        message: 'What is the name of the department?',
      }
    ])
    .then((answer) => {
      let query = 'INSERT INTO department SET ?';
      connection.query(
        query,
        {
          name: answer.name,
        },
        (err) => {
          if (err) throw err;
          console.log('Your department was added successfully!');
          // re-prompt the user for if they want to bid or post
          startPrompt();
        }
      );
    });
};