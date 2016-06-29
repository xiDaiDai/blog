userModels = require('../models/users');
postModels = require('../models/posts');
markdown = require('markdown').markdown;
var mongoose = require('mongoose');
mongoose.createConnection('mongodb://localhost/users');
var User = userModels.user;
var Post = postModels.post;

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