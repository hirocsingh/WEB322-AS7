/*********************************************************************************
 *  WEB322 – Assignment 07
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: _Avinash Singh_ Student ID: _115408163_ Date: 02-JAN-2018
 *
 * Online (Heroku) URL: https://lit-brook-78873.herokuapp.com/
 *
 ********************************************************************************/
const dataServiceComments = require("./data-service-comments.js");

var express = require("express");
var app = express();
var path = require("path");
var dataService = require("./data-service.js");
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const dataServiceAuth = require("./data-service-auth.js");
var clientSessions = require('client-sessions')

var HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.engine(".hbs", exphbs({
    extname: ".hbs",
    defaultLayout: 'layout',
    helpers: {
        counter: function(value) {
            return value + 1;
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set("view engine", ".hbs");


app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "assignment7_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
};




function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/about", function(req, res) {

    console.log(req.body);

    dataServiceComments.getAllComments().then((dataFromPromise) => {
        console.log(dataFromPromise);

        res.render("about", { data: dataFromPromise });
    }).catch((err) => {
        if (err) {
            console.log(err);
            res.render("about");
        }
    });
});


app.post("/about/addComment", (req, res) => {
    console.log(req.body);
    dataServiceComments.addComment(req.body).then(() => {
        res.redirect("/about");
    }).catch((err) => {
        if (err) {
            console.log(err);
            res.redirect("/about");
        }
    });
});

app.post("/about/addReply", (req, res) => {
    console.log(req.body);
    dataServiceComments.addReply(req.body).then(() => {
        console.log(req.body);
        res.redirect("/about");
    }).catch((err) => {
        if (err) {
            console.log(err);
            res.redirect("/about");
        }
    });
});




app.get("/employees", ensureLogin, (req, res) => {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status).then((data) => {
            res.render("employeeList", { data: data, title: "Employees" });
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees" });
        });

    } else if (req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department).then((data) => {
            res.render("employeeList", { data: data, title: "Employees" });
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees" });
        });


    } else if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager).then((data) => {
            res.render("employeeList", { data: data, title: "Employees" });
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees" });
        });

    } else {
        dataService.getAllEmployees().then((data) => {
            res.render("employeeList", { data: data, title: "Employees" });
        }).catch((err) => {
            res.render("employeeList", { data: {}, title: "Employees" });
        });
    }


});

app.get("/employee/:empNum", ensureLogin, (req, res) => {
    let viewData = {};
    dataService.getEmployeeByNum(req.params.empNum)
        .then((data) => {
            viewData.data = data;
        }).catch(() => {
            viewData.data = null;
        }).then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data;

            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.data.department) {
                    viewData.departments[i].selected = true;
                }
            }

        }).catch(() => {
            viewData.departments = [];
        }).then(() => {
            if (viewData.data == null) {
                res.status(404).send("Employee Not Found");
            } else {
                res.render("employee", { viewData: viewData });
            }
        });
});

app.get("/employee/delete/:empNum", ensureLogin, (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum).then(() => {
        res.redirect("/employees");
    }).catch((err) => {
        res.status(500).send("Unable to Remove Employee / Employee Not Found");
    });
});


app.get("/managers", ensureLogin, (req, res) => {

    dataService.getManagers().then((data) => {
        res.render("employeeList", { data: data, title: "Employees (Managers)" });
    }).catch((err) => {
        res.render("employeeList", { data: {}, title: "Employees (Managers)" });
    });

});

app.get("/departments", ensureLogin, (req, res) => {

    dataService.getDepartments().then((data) => {
        res.render("departmentList", { data: data, title: "Departments" });
    }).catch((err) => {
        res.render("departmentList", { data: {}, title: "Departments" });
    });

});

app.get("/employees/add", ensureLogin, (req, res) => {

    dataService.getDepartments().then((data) => {
        res.render("addEmployee", { departments: data });
    }).catch((err) => {
        res.render("addEmployee", { departments: [] });
    });
});


app.post("/employees/add", ensureLogin, (req, res) => {
    console.log(req.body);
    dataService.addEmployee(req.body).then(() => {
        res.redirect("/employees");
    });
});

app.get("/departments/add", ensureLogin, (req, res) => {
    res.render("addDepartment");
});

app.post("/departments/add", ensureLogin, (req, res) => {
    dataService.addDepartment(req.body).then(() => {
        res.redirect("/departments");
    });
});

app.post("/employee/update", ensureLogin, (req, res) => {
    dataService.updateEmployee(req.body).then(() => {
        res.redirect("/employees");
    });

});

app.post("/department/update", ensureLogin, (req, res) => {
    dataService.updateDepartment(req.body).then(() => {
        res.redirect("/departments");
    });

});

app.get("/department/:departmentId", ensureLogin, (req, res) => {

    dataService.getDepartmentById(req.params.departmentId).then((data) => {
        res.render("department", { data: data });
    }).catch((err) => {
        res.status(404).send("Department Not Found");
    });

});


app.get("/login", (req, res) => {
    res.render("login");
})
app.get("/register", (req, res) => {
    res.render("register");
})
app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body).then(() => {
        res.render("register", { successMessage: "User created" });
    }).catch((err) => {
        res.render("register", { errorMessage: err, user: req.body.user });
    })
})
app.post("/login", (req, res) => {
    dataServiceAuth.checkUser(req.body).then(() => {

        req.session.user = {
            username: req.body.user,
        };
        res.redirect("/employees");
    }).catch((err) => {
        res.render("login", { errorMessage: err, user: req.body.user });
    })
})
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
})

dataService.initialize()
    .then(dataServiceComments.initialize)
    .then(dataServiceAuth.initialize)
    .then(() => {
        app.listen(HTTP_PORT, onHttpStart);
    }).catch((err) => {
        console.log("error: " + err);
    });