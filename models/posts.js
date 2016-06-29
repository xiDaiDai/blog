var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var date = new Date();
//存储各种时间格式，方便以后扩展
var time = {
	date: date,
	year: date.getFullYear(),
	month: date.getFullYear() + "-" + (date.getMonth() + 1),
	day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
	minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
}
var postScheMa = new Schema({
	title: String,
	post: String,
	name: String,
	time: {
		type: Date,
		default: Date.now
	},



});
exports.post = mongoose.model('posts', postScheMa);