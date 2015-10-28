'use strict';
module.exports = function(sequelize, DataTypes) {
  var Trace = sequelize.define('Trace', {
    userId: DataTypes.UUID,
    status: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Trace;
};
