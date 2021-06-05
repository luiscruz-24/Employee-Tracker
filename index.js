// Packages
const mysql = require('mysql');
const inquirer = require('inquirer');

// Connections

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'employees',
    multipleStatements: true,
});

connection.connect((err) => {
    if (err) throw err;
    console.log(`connected as id ${connection.threadId}`);
    startPrompt();
});

const startPrompt = () => {
    inquirer
      .prompt({
        name: 'action',
        type: 'list',
        message: 'Please, select an option',
        choices: [
          'View All Employees', 
          'View All Employees By Department',
          'View All Employees By Manager',
          'Add Employee',
          'Remove Employee',
          'Update Employee Role',
          'Update Employee Manager',
          'View All Roles',
          'Add Role',
          'Remove Role',
          'View All Departments',
          'Add Department',
          'Remove Department',
          'View the total utilized budget of a department',
          'Quit',
        ],
      })
      .then((answer) => {
        switch (answer.action) {
          case 'View All Employees':
            allEmployees(); 
            break;
  
          case 'View All Employees By Department':
            departmentEmployees();
            break;
  
          case 'View All Employees By Manager':
            managerEmployees(); 
            break;
  
          case 'Add Employee':
            addEmployee();
            break;
  
          case 'Remove Employee':
            removeEmployee();
            break;
  
          case 'Update Employee Role':
            updateEmployeeRole();
            break;
  
          case 'Update Employee Manager':
            updateEmployeeManager();
            break;
  
          case 'View All Roles':
            allRoles(); 
            break;
  
          case 'Add Role':
            addRole();
            break;
  
          case 'Remove Role':
            removeRole();
            break;
  
          case 'View All Departments':
            allDepartments();
            break;
  
          case 'Add Department':
            addDepartment();
            break;
  
          case 'Remove Department':
            removeDepartment();
            break;
  
          case 'View the total utilized budget of a department':
            budgetDepartment();
            break;
  
          case 'Quit':
            connection.end();
            break;
  
          default:
            console.log(`Invalid action: ${answer.action}`);
            //connection.end();
            break;
        }
      });
  };

 //Table with the employee role and department
 const allEmployees = () => {
    let query = 'SELECT  employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, concat(m.first_name," ", m.last_name) as manager FROM employee LEFT OUTER JOIN employee m ON employee.manager_id = m.id INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id ORDER by employee.id';
    connection.query(query, (err, res) => {
      if (err) throw err;
      const transform = res.reduce((acc, {id, ...x }) => { acc[id] = x; return acc }, {})
      console.table(transform);
      startPrompt();
    });
  };

  //Selected department
  const departmentEmployees = () => {
    connection.query('SELECT * FROM department', (err, results) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'choice',
            type: 'list',
            choices() {
              return results.map((item) => item.name);
            },
            message: 'Select a department to see the employees',
          },
        ])
        .then((answer) => {
          let query = 'SELECT  employee.id, employee.first_name, employee.last_name, role.title, role.salary, concat(m.first_name," ", m.last_name) as manager FROM employee LEFT OUTER JOIN employee m ON employee.manager_id = m.id INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id WHERE department.name = ? ORDER by employee.id ';
          connection.query(query, [answer.choice], (err, res) => {
            if (err) throw err;
            const transform = res.reduce((acc, { id, ...x }) => { acc[id] = x; return acc }, {})
            console.table(transform)
            startPrompt();
          });
        });
    });
  };

  //Employees selected by manager
  const managerEmployees = () => {
    let query = 'SELECT  employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, concat(m.first_name," ", m.last_name) as manager FROM employee LEFT OUTER JOIN employee m ON employee.manager_id = m.id INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id WHERE employee.manager_id IS NOT NULL GROUP by employee.manager_id ORDER by employee.id';
    connection.query(query, (err, results) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'choice',
            type: 'list',
            choices() {
              return results.map((item) => item.manager);
            },
            message: 'Select a manager',
          },
        ])
        .then((answer) => {
          let query = 'SELECT id, first_name, last_name, title, department, salary  FROM (SELECT  employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, concat(m.first_name," ", m.last_name) as manager FROM employee LEFT OUTER JOIN employee m ON employee.manager_id = m.id INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id  ORDER by employee.id ) AS r  WHERE r.manager= ?'
          connection.query(query, [answer.choice], (err, res) => {
            if (err) throw err;
            const transform = res.reduce((acc, { id, ...x }) => { acc[id] = x; return acc }, {})
            console.table(transform)
            startPrompt();
          });
        });
    });
  };

  //Add an employee
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
  
            message: "Enter the employee's manager?",
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

  //Remove an employee
  const removeEmployee = () => {
    connection.query('SELECT concat(id,".- ",first_name," ", last_name) as rememp FROM employee', (err, results) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'choice',
            type: 'list',
            choices() {
              return results.map((item) => item.rememp);
            },
            message: 'What employee would you like to remove?',
          },
        ])
        .then((answer) => {
          let query = 'DELETE FROM employee WHERE concat(id,".- ",first_name," ", last_name) = ?';
          connection.query(query, [answer.choice], (err, res) => {
            if (err) throw err;
            console.log('An employee was removed successfully!');
            startPrompt();
          });
        });
    });
  }

  //Update the role employee
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
  
  }

  //Update the manager employee
  const updateEmployeeManager = () => {
    connection.query('SELECT concat(id,".- ",first_name," ", last_name) as updemp FROM employee; SELECT IFNULL(manid, "None") AS Resultfinal from (SELECT concat(man_id," ", manager) as manid FROM (SELECT  employee.id, employee.first_name, employee.last_name, role.title, role.salary, concat(m.first_name," ", m.last_name) as manager, m.id as man_id  FROM employee LEFT OUTER JOIN employee m ON employee.manager_id = m.id INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id GROUP by employee.manager_id ORDER by employee.id ) as manager LEFT OUTER JOIN employee r ON manager.man_id = r.id) as manageridfinal ;', (err, results) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'choice',
            type: 'list',
            choices() {
              return results[0].map((item) => item.updemp);
            },
            message: "Which employee's manager do you want to  update?",
          },
          {
            name: 'manager_id',
            type: 'list',
            choices() {
              return results[1].map((item) => item.Resultfinal);
            },
            message: "What is the employee's manager?",
          },
  
        ])
        .then((answer) => {
          const strman = answer.manager_id;
          var manid = null;
          if (strman !== 'None') {
            manid = parseInt(strman.slice(0, strman.indexOf(' ')));
          }
  
          const strid = answer.choice;
          const strnameid = parseInt(strid.slice(0, strid.indexOf('.- ')));
          let query = 'UPDATE employee SET ? WHERE ?';
          connection.query(query, [
            {
              manager_id: manid,
            },
            {
              id: strnameid,
            },
          ], (err, res) => {
            if (err) throw err;
            console.log("Employee's manager was updated successfully!");
            startPrompt();
          });
        });
    });
  
  }

  //Show all the roles
  const allRoles = () => {
    let query = 'SELECT id, title FROM role';
    connection.query(query, (err, res) => {
      if (err) throw err;
      const transformed = res.reduce((acc, { id, ...x }) => { acc[id] = x; return acc }, {})
      console.table(transformed)
      startPrompt();
    });
  
  }

  //Add a new role
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
  }

  //Remove a role
  const removeRole = () => {
    connection.query('SELECT concat(id,".- ",title) as remrol FROM role', (err, results) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'choice',
            type: 'list',
            choices() {
              return results.map((item) => item.remrol);
            },
            message: 'What role would you like to remove?(Warning: This will also remove associated employees)',
            
          },
        ])
        .then((answer) => {
          let query = 'DELETE FROM role WHERE concat(id,".- ",title) = ?';
          connection.query(query, [answer.choice], (err, res) => {
            if (err) throw err;
            console.log('Role was removed successfully!');
            startPrompt();
          });
        });
    });
  
  }

  //Show all departments
  const allDepartments = () => {
    let query = 'SELECT id, name FROM department';
    connection.query(query, (err, res) => {
      if (err) throw err;
      // Log all results of the SELECT statement
      const transformed = res.reduce((acc, { id, ...x }) => { acc[id] = x; return acc }, {})
      console.table(transformed)
      startPrompt();
    });
  }

  //Add a new department
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
  
  }

  //Remove a selected department
  const removeDepartment = () => {
    connection.query('SELECT concat(id,".- ",name) as remdep FROM department', (err, results) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'choice',
            type: 'list',
            choices() {
              return results.map((item) => item.remdep);
            },
            message: 'What department would you like to remove? (Warning: This will also remove associated roles and employees)',
          },
        ])
        .then((answer) => {
          let query = 'DELETE FROM department WHERE concat(id,".- ",name) = ?';
          connection.query(query, [answer.choice], (err, res) => {
            if (err) throw err;
            console.log('Department was removed successfully!');
            startPrompt();
          });
        });
    });
  
  }

  //View the total utilized budget of a department. BONUS
  const budgetDepartment = () => {
    connection.query('SELECT * FROM department', (err, results) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'choice',
            type: 'list',
            choices() {
              return results.map((item) => item.name);
            },
            message: 'Which department would you like to see the total utilized budget ?',
          },
        ])
        .then((answer) => {
          let query = 'SELECT SUM(salaryfi) total FROM (SELECT  employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary as salaryfi, concat(m.first_name," ", m.last_name) as manager FROM employee LEFT OUTER JOIN employee m ON employee.manager_id = m.id INNER JOIN role ON role.id = employee.role_id INNER JOIN department ON department.id = role.department_id ORDER by employee.id) as y WHERE department = ? ';
          connection.query(query, [answer.choice], (err, res) => {
            if (err) throw err;
            const total = 'The total utilized budget of a '+answer.choice+' department is $'+ res[Object.keys(res)[0]].total;
            //console.log(res[Object.keys(res)[0]].total);
            console.log('------------------------------------------------------------------------------------');
            console.log(total);
            console.log('------------------------------------------------------------------------------------');
            
            startPrompt();
          });
        });
    });
  }