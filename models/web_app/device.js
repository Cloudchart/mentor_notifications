export default (sequelize, DataTypes) => {
  let Device = sequelize.define('Device', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },

    user_id: DataTypes.UUID,
    push_token: DataTypes.STRING,
  }, {
    tableName: 'devices',
    underscored: true
  })

  return Device
}
