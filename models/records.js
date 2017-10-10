module.exports = (sequelize, DataTypes) => {
    return sequelize.define("record", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: DataTypes.INTEGER,
        record_value: DataTypes.INTEGER,
        timestamp: DataTypes.INTEGER,
    })
}