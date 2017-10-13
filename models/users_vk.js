module.exports = (sequelize, DataTypes) => {
    return sequelize.define("users_vk", {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nickname : DataTypes.STRING,
        domain  : DataTypes.STRING,
        sex  : DataTypes.STRING,
        bdate  : DataTypes.TIMESTAMP,
        city  : DataTypes.STRING,
        country  : DataTypes.STRING,
        has_mobile  : DataTypes.STRING,
    })
};
