var express = require('express');
var flash = require('connect-flash');
var fs = require('fs')
let moment = require('moment')
var { Pool } = require('pg')
var ExpressSession = require('express-session')
var router = express.Router();
let date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
var pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'C23',
  password: 'AdItYa15:)',
  port: 5432
});

/* GET home page. */

router.get('/login', (req, res) => {
  pool.query('SELECT message FROM message WHERE id = 1', (err, row) => {
    res.render('login', { messageErr: row.rows[0].message })
  })
})

router.post('/login', (req, res) => {
  pool.query(`SELECT * FROM users WHERE email = '${req.body.inputEmail}' AND password = '${req.body.inputPassword}'`, (err, row) => {
    if (row.rows.length != 0) {
      pool.query('UPDATE message SET message = false WHERE id = 1', (err, row) => {
        req.session.user = {
          email: req.body.inputEmail,
          password: req.body.inputPassword
        }
        res.redirect('/')
      })
    } else {
      pool.query('UPDATE message SET message = true WHERE id = 1', (err, row) => {
        res.redirect('/login')
      })
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err
    res.redirect('/login')
  })
})

router.get('/', function (req, res) {
  if (req.session.user) {
    var page = req.query.page ? req.query.page : 0;
    var data = ["SELECT p.projectid, p.name, u.userid, u.firstname || ' ' || u.lastname as  fullname FROM members m, projects p, users u WHERE m.projectid = p.projectid AND m.userid = u.userid AND "]
    var limit = [` ORDER BY projectid LIMIT 3 OFFSET ${page * 3} `]
    var slice = []
    var query = []
    if (req.query.cprojectid && req.query.projectid) {
      data.push(`p.projectId = ${req.query.projectid} AND `)
    }
    if (req.query.cnp && req.query.np) {
      data.push(`p.name = '${req.query.np}' AND `)
    }
    if (req.query.cmember && req.query.member) {
      data.push(`u.userid = ${req.query.member} AND `)
    }

    slice = data[data.length - 1].split(' ')
    data[data.length - 1] = slice.slice(0, slice.length - 2).join(' ')
    query = data.concat(limit).join('')
    if (req.url == '/') {
      pool.query('SELECT * FROM projects ORDER BY projectid LIMIT 3 OFFSET 0 ', (err, row) => {
        pool.query('SELECT * FROM projects', (err, leng) => {
          pool.query("SELECT p.projectid, p.name, u.userid, u.firstname || ' ' || u.lastname as  fullname FROM members m, projects p, users u WHERE m.projectid = p.projectid AND m.userid = u.userid ORDER BY p.projectid", (err, rows) => {
            pool.query('SELECT * FROM columns', (err, colum) => {
              pool.query("SELECT userid, admin, firstname || ' ' || lastname as fullname FROM users", (err, user) => {
                pool.query(`SELECT * FROM users WHERE email = '${req.session.user.email}'`, (err, checked) => {
                  console.log(checked)                  
                  res.render('index', {
                    data: row.rows,
                    user: user.rows,
                    member: rows.rows,
                    column: colum.rows,
                    leng: leng.rows.length,
                    url: req.url,
                    page: 0,
                    query: req.query,
                    admin: checked.rows[0].admin
                  })
                })
              })
            })
          })
        })
      })
    } else if (req.query.cprojectid || req.query.cnp || req.query.cmember) {
      pool.query(query, (err, row) => {
        pool.query(data.join(''), (err, leng) => {
          pool.query("SELECT p.projectid, p.name, u.userid, u.firstname || ' ' || u.lastname as  fullname FROM members m, projects p, users u WHERE m.projectid = p.projectid AND m.userid = u.userid ORDER BY p.projectid", (err, rows) => {
            pool.query('SELECT * FROM columns', (err, colum) => {
              pool.query("SELECT userid, firstname || ' ' || lastname as fullname FROM users", (err, user) => {
                pool.query(`SELECT * FROM users WHERE email = '${req.session.user.email}'`, (err, checked) => {
                  res.render('index', {
                    data: row.rows,
                    user: user.rows,
                    member: rows.rows,
                    column: colum.rows,
                    leng: leng.rows.length,
                    url: req.url,
                    page: page,
                    query: req.query,
                    admin: checked.rows[0].admin
                  })
                })
              })
            })
          })
        })
      })
    } else {
      pool.query(`SELECT * FROM projects ORDER BY projectid LIMIT 3 OFFSET ${page * 3} `, (err, row) => {
        pool.query('SELECT * FROM projects', (err, leng) => {
          pool.query("SELECT p.projectid, p.name, u.userid, u.firstname || ' ' || u.lastname as  fullname FROM members m, projects p, users u WHERE m.projectid = p.projectid AND m.userid = u.userid ORDER BY p.projectid", (err, rows) => {
            pool.query('SELECT * FROM columns', (err, colum) => {
              pool.query("SELECT userid, firstname || ' ' || lastname as fullname FROM users", (err, user) => {
                pool.query(`SELECT * FROM users WHERE email = '${req.session.user.email}'`, (err, checked) => {
                  res.render('index', {
                    data: row.rows,
                    user: user.rows,
                    member: rows.rows,
                    column: colum.rows,
                    leng: leng.rows.length,
                    url: req.url,
                    page: page,
                    query: req.query,
                    admin: checked.rows[0].admin
                  })
                })
              })
            })
          })
        })
      })
    }
  } else {
    res.redirect('/logout')
  }
});

router.post('/apply', function (req, res) {
  pool.query(`UPDATE columns SET id = ${req.body.columnId ? true : false}`, (err, row) => {
    if (err) throw err
    pool.query(`UPDATE columns SET name = ${req.body.columnName ? true : false}`, (err, row) => {
      if (err) throw err
      pool.query(`UPDATE columns SET member = ${req.body.columnMember ? true : false}`, (err, row) => {
        if (err) throw err
        res.redirect('/')
      })
    })
  })
})

router.post('/apply/:id', function (req, res) {
  pool.query(`UPDATE columns SET id = ${req.body.columnId ? true : false}`, (err, row) => {
    if (err) throw err
    pool.query(`UPDATE columns SET name = ${req.body.columnName ? true : false}`, (err, row) => {
      if (err) throw err
      pool.query(`UPDATE columns SET member = ${req.body.columnMember ? true : false}`, (err, row) => {
        if (err) throw err
        res.redirect(`/issues/${req.params.id}`)
      })
    })
  })
})

router.get('/profile', (req, res) => {
  pool.query(`SELECT u.userid, u.email, u.password, u.type, m.role FROM users u INNER JOIN members m ON u.userid = m.userid WHERE email = ${req.session.user.email}`, (err, row) => {
    res.render('profile', { data: row.rows })
  })
})

router.post('/profile', function (req, res) {
  if (req.body.profileEmail && req.body.profilePassword) {
    pool.query(`UPDATE users SET email = '${req.body.profileEmail}', password = '${req.body.profilePassword}' , status = ${req.body.profileStatus ? true : false} WHERE userid = ${req.body.profileUserid}`, (err, row) => {
      pool.query(`UPDATE members SET role = '${req.body.profilePosition}' WHERE userid = ${req.body.profileUserid}`, (err, row) => {
        res.redirect('/profile')
      })
    })
  } else {
    res.redirect('/profile')
  }
})

router.post('/save', function (req, res) {
  var values = Object.values(req.body)
  var projectid = []
  var role = []
  var slice = []
  var ds = []
  var query = ['INSERT INTO members(projectid, role, userid) VALUES ']
  pool.query(`INSERT INTO projects (name) VALUES ('${req.body.addProject}')`, (err, row) => {
    pool.query(`SELECT projectid FROM projects WHERE name = '${req.body.addProject}'`, (err, row) => {
      for (var i = 1; i < values.length; i++) {
        ds = values[i].split('-')
        projectid.push(ds[0])
        role.push(ds[1])
        query.push(`(${row.rows[0].projectid}, '${role[i - 1]}', ${parseInt(projectid[i - 1])}) , `)
      }
      slice = query[query.length - 1].split(' ')
      query[query.length - 1] = slice.slice(0, slice.length - 2).join(' ')
      pool.query(query.join(''), (err, row) => {
        res.redirect('/')
      })

    })
  })
})

router.get('/delete/:id', function (req, res) {
  pool.query(`DELETE FROM issues WHERE projectid = ${req.params.id}`, (err, row) => {
    pool.query(`DELETE FROM members WHERE projectid = ${req.params.id}`, (err, row) => {
      pool.query(`DELETE FROM projects WHERE projectid = ${req.params.id}`, (err, row) => {
        res.redirect('/')
      })
    })
  })
})

router.get('/edit/:id', function (req, res) {
  pool.query("SELECT DISTINCT(u.userid), u.firstname || ' ' || u.lastname AS fullname, m.role FROM users u INNER JOIN members m on u.userid = m.userid", (err, member) => {
    pool.query(`SELECT p.projectid, p.name, u.userid, u.firstname || ' ' || u.lastname as fullname FROM members m, projects p, users u 
                WHERE m.projectid = p.projectid AND m.userid = u.userid AND p.projectid = ${req.params.id} ORDER BY p.projectid`, (err, row) => {
        pool.query(`SELECT name FROM projects WHERE projectid = ${req.params.id}`, (err, projectName) => {
          res.render('edit', { data: row.rows, member: member.rows, projectid: req.params.id, projectname: projectName.rows })
        })
      })
  })
})

router.post('/edit/:id', function (req, res) {
  var members = req.body.members
  let msplit = []
  var values = []
  if (members) {
    if (typeof members == "string") {
      msplit = members.split(',')
      values.push(`(${msplit[0]}, '${msplit[1]}', ${msplit[2]})`)
    } else {
      for (let i = 0; i < members.length; i++) {
        msplit = members[i].split(',')
        values.push(`(${msplit[0]}, '${msplit[1]}', ${msplit[2]})`)
      }
    }
  }
  let query = `INSERT INTO members(userid, role, projectid) VALUES ${values.join(', ')}`;
  pool.query(`UPDATE projects SET name = '${req.body.editProject}' WHERE projectid = ${req.params.id}`, (err, row) => {
    pool.query(`DELETE FROM members WHERE projectid = ${req.params.id}`, (err, row) => {
      pool.query(query, (err, row) => {
        res.redirect('/')
      })
    })
  })
})

router.get('/add', function (req, res) {
  pool.query("SELECT DISTINCT(u.userid), m.role, u.firstname || ' ' || u.lastname AS fullname FROM users u INNER JOIN members m ON u.userid = m.userid", (err, row) => {
    res.render('add', { data: row.rows })
  })
})

router.get('/details/:id', (req, res) => {
  res.render('details', { projectid: req.params.id })
})

router.get('/issues/:id', (req, res) => {
  let page = req.query.page ? req.query.page : 0
  let slice = []
  let tampung = ['SELECT issueid, subject, tracker FROM issues WHERE ']
  if (req.query.cid) {
    tampung.push(`issueid = ${req.query.id} AND `)
  }
  if (req.query.csubject) {
    tampung.push(`subject = '${req.query.subject}' AND `)
  }
  if (req.query.ctracker) {
    tampung.push(`tracker = '${req.query.tracker}' AND `)
  }
  slice = tampung[tampung.length - 1].split(' ')
  tampung[tampung.length - 1] = slice.slice(0, slice.length - 2).join(' ')
  let query = tampung.join('')

  if (req.url == `/issues/${req.params.id}`) {
    pool.query(`SELECT issueid, subject, tracker FROM issues WHERE projectid = ${req.params.id} LIMIT 3 OFFSET 0`, (err, row) => {
      pool.query('SELECT * FROM columns', (err, col) => {
        res.render('issues', {
          data: row.rows,
          leng: row.rows.length,
          column: col.rows,
          page: page,
          url: req.url,
          projectid: req.params.id,
          query: req.query
        })
      })
    })
  } else if (req.query.cid || req.query.csubject || req.query.ctracker) {
    pool.query(query, (err, row) => {
      pool.query('SELECT * FROM columns', (err, col) => {
        res.render('issues', {
          data: row.rows,
          leng: row.rows.length,
          column: col.rows,
          page: page,
          url: req.url,
          projectid: req.params.id,
          query: req.query
        })
      })
    })
  } else {
    pool.query(`SELECT issueid, subject, tracker FROM issues WHERE projectid = ${req.params.id} LIMIT 3 OFFSET ${page * 3}`, (err, row) => {
      pool.query('SELECT * FROM columns', (err, col) => {
        res.render('issues', {
          data: row.rows,
          leng: row.rows.length,
          column: col.rows,
          page: page,
          url: req.url,
          projectid: req.params.id,
          query: req.query
        })
      })
    })
  }
})

router.get('/members/:id', (req, res) => {
  let page = req.query.page ? req.query.page : 0
  let slice = []
  let tampung = [`SELECT DISTINCT(u.userid), m.projectid, u.firstname || ' ' || u.lastname as fullname, m.role from users u inner join members m on m.userid = u.userid 
                  WHERE projectid = ${req.params.id} AND `]
  if (req.query.cid) {
    tampung.push(`u.userid = ${req.query.id} AND `)
  }
  if (req.query.cname) {
    tampung.push(`(u.firstname ILIKE '%${req.query.name}%' OR u.lastname ILIKE '%${req.query.name}%') AND `)
  }
  if (req.query.cposition) {
    tampung.push(`m.role = '${req.query.position}' AND `)
  }
  slice = tampung[tampung.length - 1].split(' ')
  tampung[tampung.length - 1] = slice.slice(0, slice.length - 2).join(' ')
  let query = tampung.join('')

  if (req.url == `/members/${req.params.id}`) {
    pool.query(`SELECT DISTINCT(u.userid), m.projectid, u.firstname || ' ' || u.lastname as fullname, m.role from users u inner join members m on m.userid = u.userid 
                WHERE projectid = ${req.params.id}`, (err, row) => {
        pool.query('SELECT * FROM columns', (err, col) => {
          res.render('members', {
            data: row.rows,
            leng: row.rows.length,
            column: col.rows,
            page: page,
            url: req.url,
            projectid: req.params.id,
            query: req.query
          })
        })
      })
  } else if (req.query.cid || req.query.cname || req.query.cposition) {
    pool.query(query, (err, row) => {
      pool.query('SELECT * FROM columns', (err, col) => {
        res.render('members', {
          data: row.rows,
          leng: row.rows.length,
          column: col.rows,
          page: page,
          url: req.url,
          projectid: req.params.id,
          query: req.query
        })
      })
    })
  } else {
    pool.query(`SELECT DISTINCT(u.userid), m.projectid, u.firstname || ' ' || u.lastname as fullname, m.role from users u inner join members m on m.userid = u.userid 
                WHERE projectid = ${req.params.id}`, (err, row) => {
        pool.query('SELECT * FROM columns', (err, col) => {
          res.render('members', {
            data: row.rows,
            leng: row.rows.length,
            column: col.rows,
            page: page,
            url: req.url,
            projectid: req.params.id,
            query: req.query
          })
        })
      })
  }
})

router.get('/members/delete/:pid/:mid', (req, res) => {
  pool.query(`DELETE FROM members WHERE projectid = ${req.params.pid} AND userid = ${req.params.mid}`, (err, rows) => {
    if (err) throw err
    res.redirect(`/members/${req.params.pid}`)
  })
})

router.get('/members/add/:id', (req, res) => {
  pool.query("SELECt DISTINCT(u.userid), u.firstname || ' ' || u.lastname as fullname, m.role FROM members m INNER JOIN users u on m.userid = u.userid", (err, row) => {
    res.render('addmember', {
      data: row.rows,
      projectid: req.params.id
    })
  })
})

router.post('/members/add/:id', (req, res) => {
  let member = req.body.member
  let split = member.split(',')
  pool.query(`INSERT INTO members(userid, role, projectid) VALUES(${split[0]}, '${split[1]}', ${req.params.id})`, (err, row) => {
    res.redirect(`/members/${req.params.id}`)
  })
})

router.get('/issues/add/:id', (req, res) => {
  pool.query(`SELECT DISTINCT(u.userid), u.firstname || ' ' || u.lastname as fullname, m.role FROM members m INNER JOIN users u ON m.userid = u.userid`, (err, row) => {
    res.render('addissue', {
      data: row.rows,
      projectid: req.params.id
    })
  })
})

router.post('/issues/add/:id', (req, res) => {
  pool.query(`INSERT INTO issues(projectid, tracker, subject, description, status, priority, assignee, startdate, duedate, estimatedtime, done, files) 
              VALUES (${req.params.id},
                '${req.body.tracker}',
                '${req.body.subject}',
                '${req.body.description}',
                '${req.body.status}',
                '${req.body.priority}',
                ${req.body.assignee},
                '${req.body.stdate}',
                '${req.body.dudate}',
                '${req.body.esdate}',
                ${req.body.done},
                '${req.body.files}');`,
    (err, row) => {
      pool.query(`SELECT userid FROM users WHERE  email = ${req.session.user.email}`, (err, statuslogin) => {
        pool.query('SELECT issueid FROM issues ORDER BY issueid DESC LIMIT 1 OFFSET 0', (err, issueid) => {
          pool.query(`INSERT INTO activity(time, title, description, author, issueid, status, projectid) VALUES (${'\'' + date + '\''}, '${req.body.subject}', '${req.body.description}', ${statuslogin.rows[0].userid}, ${issueid.rows[0].issueid}, '${req.body.status}', ${req.params.id})`, (err, row) => {
            res.redirect(`/issues/${req.params.id}`)
          })
        })
      })
    })
})

router.get('/issues/delete/:param/:id', (req, res) => {
  pool.query(`DELETE FROM issues WHERE issueid = ${req.params.id}`, (err, row) => {
    res.redirect(`/issues/${req.params.param}`)
  })
})

router.get('/issues/edit/:param/:id', (req, res) => {
  pool.query("SELECT userid, firstname || ' ' || lastname as fullname FROM users", (err, user) => {
    pool.query(`SELECT * FROM issues WHERE issueid = ${req.params.id}`, (err, issue) => {
      res.render('editissue', {
        moment: moment,
        data: issue.rows,
        user: user.rows,
        projectid: req.params.param,
        issueid: req.params.id
      })
    })
  })
})

router.post('/issues/edit/:param/:id', (req, res) => {
  let query = `UPDATE issues SET tracker = '${req.body.tracker}',
              subject = ${req.body.subject ? '\'' + req.body.subject + '\'' : null},
              description = ${req.body.description ? '\'' + req.body.description + '\'' : null},
              status = '${req.body.status}',
              priority = '${req.body.priority}',
              assignee = ${req.body.assignee},
              startdate = ${req.body.stdate ? '\'' + req.body.stdate + '\'' : null},
              duedate = ${req.body.dudate ? '\'' + req.body.dudate + '\'' : null},
              estimatedtime = ${req.body.esdate ? '\'' + req.body.esdate + '\'' : null},
              done = ${req.body.done},
              files = ${req.body.files ? '\'' + req.body.files + '\'' : null},
              spenttime = ${req.body.spenttime ? '\'' + req.body.spenttime + '\'' : null},
              targetversion = ${req.body.targetversion ? '\'' + req.body.targetversion + '\'' : null},
              author = ${req.body.author},
              createddate = ${req.body.createddate ? '\'' + req.body.createddate + '\'' : null},
              updateddate = ${req.body.updateddate ? '\'' + req.body.updateddate + '\'' : null},
              closeddate = ${req.body.closeddate ? '\'' + req.body.closeddate + '\'' : null},
              parenttask = ${req.body.parenttask ? '\'' + req.body.parenttask + '\'' : null} 
              WHERE issueid = ${req.params.id}`
  pool.query(query, (err, row) => {
    pool.query(`SELECT userid FROM users WHERE email = ${req.session.user.email}`, (err, statuslogin) => {
      pool.query(`INSERT INTO activity(time, title, description, author, issueid, status, projectid) VALUES (${'\'' + date + '\''}, ${req.body.subject ? '\'' + req.body.subject + '\'' : null}, ${req.body.description ? '\'' + req.body.description + '\'' : null}, ${statuslogin.rows[0].userid}, ${req.params.id}, '${req.body.status}', ${req.params.param})`, (err, row) => {
        res.redirect(`/issues/${req.params.param}`)
      })
    })
  })
})

router.get('/activity/:id', (req, res) => {
  let a = []
  let b = []
  let c = []
  let d = []
  let e = []
  let f = []
  let g = []
  pool.query("SELECT a.activityid, a.time, a.title, a.description, a.author, a.issueid, a.status, a.projectid, u.firstname || ' ' || u.lastname as fullname FROM activity a left join users u on a.author = u.userid WHERE time > NOW()::date - integer '7' ORDER BY time DESC", (err, row) => {
    row.rows.forEach((val) => {
      // console.log(val)
      let date = moment(val.time).format('DD-MM-YYYY')
      switch (date) {
        case moment().format('DD-MM-YYYY'):
          a.push(val)
          break;
        case moment().subtract(1, 'days').format('DD-MM-YYYY'):
          b.push(val)
          break;
        case moment().subtract(2, 'days').format('DD-MM-YYYY'):
          c.push(val)
          break;
        case moment().subtract(3, 'days').format('DD-MM-YYYY'):
          d.push(val)
          break;
        case moment().subtract(4, 'days').format('DD-MM-YYYY'):
          e.push(val)
          break;
        case moment().subtract(5, 'days').format('DD-MM-YYYY'):
          f.push(val)
          break;
        case moment().subtract(6, 'days').format('DD-MM-YYYY'):
          g.push(val)
          break;
      }
    })
    res.render('activity', {
      data: row.rows,
      projectid: req.params.id,
      moment: moment,
      date1: a,
      date2: b,
      date3: c,
      date4: d,
      date5: e,
      date6: f,
      date7: g
    })
  })
})

module.exports = router;
