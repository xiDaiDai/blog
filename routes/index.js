userModels = require('../models/users');
postModels = require('../models/posts');
markdown = require('markdown').markdown;
var mongoose = require('mongoose');
mongoose.createConnection('mongodb://localhost/users');
var User = userModels.user;
var Post = postModels.post;
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/images')
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname)
	}
});
var upload = multer({
	storage: storage
});

module.exports = function(app) {
	app.get('/', function(req, res) {
		// 
		Post.find({
			name: req.session.user.name
		}, function(err, posts) {
			if (err) {
				posts = [];
			}

			posts.forEach(function(doc) {
				doc.post = markdown.toHTML(doc.post);
			});
			res.render('index', {
				title: '主页',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {

		res.render('reg', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name
		var password = req.body.password
		var password_re = req.body['password-repeat'];

		//检验用户两次输入的密码是否一致
		if (password_re != password) {
			req.flash('error', '两次输入的密码不一致!');
			return res.redirect('/reg'); //返回注册页
		}

		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});
		User.find({
			name: name
		}, function(error, result) {
			if (error) {
				console.log(error);
				return res.redirect('/reg'); //返回注册页
			}
			console.log(result.length);
			if (result.length > 0) {
				req.flash('error', '用户名已存在！');
				return res.redirect('/reg');
			}

			newUser.save(function(err) { //存储  
				if (err) {
					req.flash('error', '注册失败！');
					return res.redirect('/reg');
				}
				req.session.user = newUser;
				req.flash('success', '注册成功！');
				return res.redirect('/');
			});

		});



	});

	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {
			title: '登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {

		//检查用户是否存在
		User.findOne({
			name: req.body.name
		}, function(err, user) {
			if (!user) {
				req.flash('error', '用户不存在!');
				return res.redirect('/login'); //用户不存在则跳转到登录页
			}
			//检查密码是否一致
			if (user.password != req.body.password) {
				req.flash('error', '密码错误!');
				return res.redirect('/login'); //密码错误则跳转到登录页
			}
			//用户名密码都匹配后，将用户信息存入 session
			req.session.user = user;
			req.flash('success', '登陆成功!');
			res.redirect('/'); //登陆成功后跳转到主页
		});
	});

	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', {
			title: '发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user;
		var post = new Post({
			name: currentUser.name,
			title: req.body.title,
			post: req.body.post
		});
		post.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功!');
			res.redirect('/'); //发表成功跳转到主页
		});

	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', '登出成功!');
		res.redirect('/'); //登出成功后跳转到主页
	});

	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res) {
		res.render('upload', {
			title: '文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});


	app.post('/upload', checkLogin);
	app.post('/upload', upload.array('field1', 5), function(req, res) {
		req.flash('success', '文件上传成功!');
		res.redirect('/upload');
	});


	app.get('/u/:name', function(req, res) {
		//检查用户是否存在
		User.findOne({
			name: req.params.name
		}, function(err, user) {
			if (!user) {
				req.flash('error', '用户不存在!');
				return res.redirect('/'); //用户不存在则跳转到主页
			}
			//查询并返回该用户的所有文章
			Post.find({
				name: user.name
			}, function(err, posts) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});


	app.get('/u/:name/:title', function(req, res) {
		Post.findOne({
			name: req.params.name,
			title: req.params.title
		}, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});



	app.get('/edit/:name/:title', checkLogin);
	app.get('/edit/:name/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.findOne({
			name: currentUser.name,
			title: req.params.title
		}, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			res.render('edit', {
				title: '编辑',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});


	app.post('/edit/:name/:title', checkLogin);
	app.post('/edit/:name/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.update({
			name: currentUser.name,
			title: req.params.title,
		}, {
			$set: {
				post: req.body.post
			}
		}, function(err) {
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.title);
			if (err) {
				req.flash('error', err);
				return res.redirect(url); //出错！返回文章页
			}
			req.flash('success', '修改成功!');
			res.redirect(url); //成功！返回文章页
		});
	});


	app.get('/remove/:name/:title', checkLogin);
	app.get('/remove/:name/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.remove({
			name: currentUser.name,
			title: req.params.title
		}, function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '删除成功!');
			res.redirect('/');
		});
	});



	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', '未登录!');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if (req.session.user) {
			req.flash('error', '已登录!');
			res.redirect('back'); //返回之前的页面
		}
		next();
	}
};