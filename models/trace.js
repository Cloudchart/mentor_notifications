export default (sequelize, DataTypes) => {
  let Trace = sequelize.define('Trace', {
    userId: DataTypes.UUID,
    status: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: (models) => {
        // associations can be defined here
      }
    }
  })
  return Trace
}
