export default (sequelize, DataTypes) => {
  let Insight = sequelize.define('Insight', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'insights',
    underscored: true,
    classMethods: {
      associate: (models) => {
        // associations can be defined here
      }
    }
  })
  return Insight
}
