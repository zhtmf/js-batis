const Handlebars = require('handlebars');
const util = require('util');
const ExactException = require('./exact-exception');

function handleBarsInstance(placeholderFunc) {
	const ret = Handlebars.create();

	const evalCache = {};
	const sqlParametersStore = [];

	function trimWord(str, word){
		if (!str) return "";
		str = str.trim();
		word = (word + '').toLowerCase();
		if(str.substring(0, word.length).toLowerCase() === word)
			str = str.substring(word.length);
		if(str.substring(str.length - word.length).toLowerCase() === word)
			str = str.substring(0, str.length - word.length);
		return str;
	}

	ret.registerHelper("$", function(expression, options) {
		let body = `with(this){return ${expression}};`;
		try {
			return (evalCache[body] =
				evalCache[body] || new Function(body)).call(this);
		} catch (e) {
			throw new ExactException(
				"Engine",
				0,
				`$ expression error, context:${util.inspect(
					this
				)}, expression:${expression}, error:${e}`
			);
		}
	});

	ret.registerHelper("for", function(context, options, c) {
		if (!context || !context.length) return "";
		let str = "";
		let innerContext = Object.assign(this, {});
		for (let index = 0; index < context.length; ++index) {
			innerContext.item = context[index];
			innerContext.index = index;
			str += options.fn(innerContext);
		}
		str = str.trim();
		if (str.endsWith(",")) str = str.slice(0, -1);
		return str;
	});

	ret.registerHelper("where", function(options) {
		let expression = options.fn(this);
		if(!expression.trim())
			return "";
		expression = trimWord(expression, 'AND');
		return " WHERE " + expression.trim();
	});

	ret.registerHelper("$if", function(expression, options) {
		return ret.helpers["$"].apply(this, [expression, options])
			? options.fn(this)
			: options.inverse(this);
	});

	ret.registerHelper("$trim", function(word, options){
		let expression = options.fn(this);
		expression = trimWord(expression, word);
		return expression.trim();;
	});

	ret.registerHelper("sql", function(expression) {
		sqlParametersStore.push(expression);
		return placeholderFunc(sqlParametersStore.length - 1);
	});

	ret.resetStore = function() {
		let result = [].concat(sqlParametersStore);
		sqlParametersStore.length = 0;
		return result;
	};

	return ret;
}

class Engine {
	constructor(placeholderFunc) {
		this.handlebars = handleBarsInstance(placeholderFunc);
		this.partialCache = {};
		this.sqlCache = {};
	}
	generate(sql, partials, context) {

		for (let name in partials) {
			let value = partials[name];
			if (!this.partialCache[name]) {
				this.handlebars.registerPartial(name, value);
				this.partialCache[name] = 1;
			}
		}

		if (!this.sqlCache[sql]) {
			this.sqlCache[sql] = this.handlebars.compile(sql);
		}

		try {
			sql = this.sqlCache[sql](context);
		} catch (e) {
			this.handlebars.resetStore();
			throw e;
		}

		return { sql, parameters : this.handlebars.resetStore() };
	}
}

module.exports = Engine;
