var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var commentScheMa = new Schema({
	name: String,
	title: String,
	comment: String,
	time: {
		type: Date,
		default: Date.now
	}
});
exports.comment = mongoose.model('comments', commentScheMa);