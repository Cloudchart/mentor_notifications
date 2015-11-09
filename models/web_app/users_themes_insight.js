export default (sequelize, DataTypes) => {
  let UsersThemesInsight = sequelize.define('UsersThemesInsight', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID
    },
    insight_id: {
      type: DataTypes.UUID
    },
    rate: {
      type: DataTypes.INTEGER
    }
  }, {
    underscored: true,
    tableName: 'users_themes_insights',
    classMethods: {
      associate: (models) => {
        // associations can be defined here
      }
    }
  })
  return UsersThemesInsight
}
