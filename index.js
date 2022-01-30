let decorators = require('./lib/decorators')
module.exports = {
	DataSource: decorators.DataSource,
	Param: decorators.Param,
	Select: decorators.Select,
	SelectOne: decorators.SelectOne,
	Update: decorators.Update,
	Delete: decorators.Delete,
	Insert: decorators.Insert,
	Result: decorators.Result,
	Transactional: decorators.Transactional,
	Cleanup: decorators.Cleanup,
	
	DEFAULT_CATEGORRY_NAME : decorators.DEFAULT_CATEGORRY_NAME,
	DataSourceClass: decorators.DataSourceClass,
	Execute: decorators.Execute,
}