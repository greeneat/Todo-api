module.exports = function(sequelize,DataType){
    return sequelize.define('todo',{
        description: {
            type: DataType.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        completed: {
            type: DataType.BOOLEAN,
            allowNull: false
        }
    });    
}