export default (sequelize, DataTypes) => {
  let User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active'
    }
  }, {
    underscored: true,
    classMethods: {
      associate: (models) => {
        // associations can be defined here
      }
    }
  })
  return User
}
